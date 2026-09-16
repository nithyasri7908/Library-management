"""
Views and API Endpoints for Django REST Framework.

Provides ViewSets for:
- Book CRUD, filtering, searching
- Member CRUD, active borrow protections
- BorrowRecord issuance, return processing, status sync
- Dashboard statistics view
"""

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q, Sum, Count
from django.utils import timezone

from .models import Book, Member, BorrowRecord
from .serializers import (
    BookSerializer,
    MemberSerializer,
    BorrowRecordReadSerializer,
    BorrowRecordWriteSerializer,
)


class BookViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for Books.
    Supports search query (?search=...) and category filter (?category=...).
    """
    queryset = Book.objects.all()
    serializer_class = BookSerializer

    def get_queryset(self):
        queryset = Book.objects.all()
        search = self.request.query_params.get('search', None)
        category = self.request.query_params.get('category', None)
        available_only = self.request.query_params.get('available_only', None)

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(author__icontains=search) |
                Q(isbn__icontains=search) |
                Q(publisher__icontains=search)
            )

        if category and category != 'All':
            queryset = queryset.filter(category=category)

        if available_only == 'true':
            queryset = queryset.filter(available_quantity__gt=0)

        return queryset


class MemberViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for Members.
    Supports search query (?search=...) and department filter (?department=...).
    Prevents deletion if member has active loans.
    """
    queryset = Member.objects.all()
    serializer_class = MemberSerializer

    def get_queryset(self):
        queryset = Member.objects.all()
        search = self.request.query_params.get('search', None)
        department = self.request.query_params.get('department', None)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(member_id__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )

        if department and department != 'All':
            queryset = queryset.filter(department=department)

        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        active_loans = instance.borrow_records.filter(
            status__in=[BorrowRecord.STATUS_ISSUED, BorrowRecord.STATUS_OVERDUE]
        ).count()
        if active_loans > 0:
            return Response(
                {"detail": f"Cannot delete member '{instance.name}' because they have {active_loans} unreturned book(s)."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


class BorrowRecordViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for Book Borrow Records.
    Auto-switches between Read (nested) and Write (FK IDs) serializers.
    """
    queryset = BorrowRecord.objects.all()

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return BorrowRecordReadSerializer
        return BorrowRecordWriteSerializer

    def get_queryset(self):
        queryset = BorrowRecord.objects.all().select_related('book', 'member')
        
        # Dynamically evaluate overdue status for issued records
        today = timezone.now().date()
        for record in queryset:
            if record.status == BorrowRecord.STATUS_ISSUED and record.due_date < today:
                record.status = BorrowRecord.STATUS_OVERDUE
                record.save(update_fields=['status'])

        status_param = self.request.query_params.get('status', None)
        search = self.request.query_params.get('search', None)

        if status_param and status_param != 'All':
            queryset = queryset.filter(status=status_param)

        if search:
            queryset = queryset.filter(
                Q(book__title__icontains=search) |
                Q(book__isbn__icontains=search) |
                Q(member__name__icontains=search) |
                Q(member__member_id__icontains=search)
            )

        return queryset

    @action(detail=True, methods=['post'], url_path='return')
    def mark_returned(self, request, pk=None):
        """
        Custom endpoint to mark a borrow record as Returned:
        POST /api/borrow-records/{id}/return/
        """
        record = self.get_object()
        if record.status == BorrowRecord.STATUS_RETURNED:
            return Response(
                {"detail": "This book has already been returned."},
                status=status.HTTP_400_BAD_REQUEST
            )

        record.status = BorrowRecord.STATUS_RETURNED
        record.return_date = timezone.now().date()
        record.save(update_fields=['status', 'return_date'])

        # Increment available copies of the book
        book = record.book
        book.available_quantity = min(book.quantity, book.available_quantity + 1)
        book.save(update_fields=['available_quantity'])

        serializer = BorrowRecordReadSerializer(record)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DashboardStatsView(APIView):
    """
    Provides aggregated statistics for the Library Dashboard.
    GET /api/dashboard/stats/
    """
    def get(self, request):
        today = timezone.now().date()

        # Update overdue records first
        BorrowRecord.objects.filter(
            status=BorrowRecord.STATUS_ISSUED,
            due_date__lt=today
        ).update(status=BorrowRecord.STATUS_OVERDUE)

        total_books = Book.objects.count()
        total_copies = Book.objects.aggregate(total=Sum('quantity'))['total'] or 0
        available_copies = Book.objects.aggregate(total=Sum('available_quantity'))['total'] or 0
        borrowed_copies = max(0, total_copies - available_copies)

        total_members = Member.objects.count()
        
        active_borrows = BorrowRecord.objects.filter(status=BorrowRecord.STATUS_ISSUED).count()
        overdue_borrows = BorrowRecord.objects.filter(status=BorrowRecord.STATUS_OVERDUE).count()
        returned_borrows = BorrowRecord.objects.filter(status=BorrowRecord.STATUS_RETURNED).count()

        # Category breakdown
        category_counts = list(
            Book.objects.values('category')
            .annotate(count=Count('id'), total_copies=Sum('quantity'))
            .order_by('-count')[:6]
        )

        # Recent transactions
        recent_borrows = BorrowRecord.objects.select_related('book', 'member').order_by('-id')[:5]
        recent_serialized = BorrowRecordReadSerializer(recent_borrows, many=True).data

        return Response({
            'total_books': total_books,
            'total_copies': total_copies,
            'available_copies': available_copies,
            'borrowed_copies': borrowed_copies,
            'total_members': total_members,
            'active_borrows': active_borrows,
            'overdue_borrows': overdue_borrows,
            'returned_borrows': returned_borrows,
            'categories': category_counts,
            'recent_borrows': recent_serialized,
        })
