"""
Serializers for Django REST Framework.
Converts complex model instances into JSON representations and handles validation.
"""

from rest_framework import serializers
from django.utils import timezone
from .models import Book, Member, BorrowRecord


class BookSerializer(serializers.ModelSerializer):
    """
    Serializer for Book model.
    Validates publication year, total quantity, and available quantity.
    """
    class Meta:
        model = Book
        fields = [
            'id',
            'title',
            'author',
            'isbn',
            'category',
            'publisher',
            'publication_year',
            'quantity',
            'available_quantity',
        ]
        extra_kwargs = {
            'isbn': {
                'error_messages': {
                    'unique': 'A book with this duplicate ISBN already exists in the library.',
                    'blank': 'ISBN is a required field.'
                }
            },
            'title': {'error_messages': {'blank': 'Title is a required field.'}},
            'author': {'error_messages': {'blank': 'Author is a required field.'}},
            'category': {'error_messages': {'blank': 'Category is a required field.'}},
        }

    def validate_publication_year(self, value):
        current_year = timezone.now().year
        if value < 1000 or value > current_year:
            raise serializers.ValidationError(
                f"Publication year must be between 1000 and {current_year}."
            )
        return value

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value

    def validate(self, data):
        quantity = data.get('quantity', getattr(self.instance, 'quantity', None))
        available = data.get('available_quantity', getattr(self.instance, 'available_quantity', None))

        if available is not None and quantity is not None:
            if available > quantity:
                raise serializers.ValidationError({
                    'available_quantity': "Available quantity cannot exceed total quantity."
                })
            if available < 0:
                raise serializers.ValidationError({
                    'available_quantity': "Available quantity cannot be negative."
                })
        return data


class MemberSerializer(serializers.ModelSerializer):
    """
    Serializer for Member model.
    Validates member_id, email, phone, and registration_date.
    """
    active_borrows_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Member
        fields = [
            'id',
            'member_id',
            'name',
            'email',
            'phone',
            'department',
            'registration_date',
            'active_borrows_count',
        ]
        extra_kwargs = {
            'member_id': {
                'error_messages': {
                    'unique': 'A member with this duplicate Member ID already exists.',
                    'blank': 'Member ID is a required field.'
                }
            },
            'email': {
                'error_messages': {
                    'unique': 'A member with this duplicate email address already exists.',
                    'blank': 'Email is a required field.',
                    'invalid': 'Please provide a valid email address.'
                }
            },
            'name': {'error_messages': {'blank': 'Name is a required field.'}},
            'phone': {'error_messages': {'blank': 'Phone number is a required field.'}},
            'department': {'error_messages': {'blank': 'Department is a required field.'}},
        }

    def get_active_borrows_count(self, obj):
        # Counts unreturned books borrowed by this member
        return obj.borrow_records.filter(status__in=[BorrowRecord.STATUS_ISSUED, BorrowRecord.STATUS_OVERDUE]).count()

    def validate_member_id(self, value):
        if not value or len(value.strip()) < 3:
            raise serializers.ValidationError("Member ID must have at least 3 characters.")
        return value.strip()

    def validate_phone(self, value):
        import re
        if not value or not re.match(r'^[\d\+\-\s]+$', value.strip()):
            raise serializers.ValidationError("Phone number must contain valid numeric characters.")
        return value.strip()


class BorrowRecordReadSerializer(serializers.ModelSerializer):
    """
    Serializer for reading BorrowRecord instances with nested Book and Member representations.
    """
    book = BookSerializer(read_only=True)
    member = MemberSerializer(read_only=True)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = BorrowRecord
        fields = [
            'id',
            'book',
            'member',
            'issue_date',
            'due_date',
            'return_date',
            'status',
            'is_overdue',
        ]

    def get_is_overdue(self, obj):
        if obj.status == BorrowRecord.STATUS_ISSUED and obj.due_date < timezone.now().date():
            return True
        return obj.status == BorrowRecord.STATUS_OVERDUE


class BorrowRecordWriteSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating BorrowRecord instances using foreign key IDs.
    Manages stock quantity adjustments automatically.
    """
    class Meta:
        model = BorrowRecord
        fields = [
            'id',
            'book',
            'member',
            'issue_date',
            'due_date',
            'return_date',
            'status',
        ]
        extra_kwargs = {
            'book': {
                'error_messages': {
                    'does_not_exist': 'Invalid book ID. This book does not exist.',
                    'null': 'Book ID is required.'
                }
            },
            'member': {
                'error_messages': {
                    'does_not_exist': 'Invalid member ID. This member does not exist.',
                    'null': 'Member ID is required.'
                }
            }
        }

    def validate(self, data):
        issue_date = data.get('issue_date', timezone.now().date())
        due_date = data.get('due_date')

        if due_date and issue_date and due_date < issue_date:
            raise serializers.ValidationError({
                'due_date': "Due date cannot be prior to issue date."
            })

        # On creation, verify book availability
        if not self.instance:
            book = data.get('book')
            if book and book.available_quantity <= 0:
                raise serializers.ValidationError({
                    'book': f"'{book.title}' has no copies currently available for issuance."
                })

        return data

    def create(self, validated_data):
        book = validated_data['book']
        
        # Decrement available copy
        book.available_quantity = max(0, book.available_quantity - 1)
        book.save()

        # Enforce that status is 'Issued' upon creation, overriding payload
        validated_data['status'] = BorrowRecord.STATUS_ISSUED
        
        # Only mark as overdue if the due date is somehow already in the past on creation
        due_date = validated_data.get('due_date')
        if due_date and due_date < timezone.now().date():
            validated_data['status'] = BorrowRecord.STATUS_OVERDUE

        return super().create(validated_data)

    def update(self, instance, validated_data):
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        book = instance.book

        # If marking as Returned, adjust book stock back up
        if old_status in [BorrowRecord.STATUS_ISSUED, BorrowRecord.STATUS_OVERDUE] and new_status == BorrowRecord.STATUS_RETURNED:
            if not validated_data.get('return_date'):
                validated_data['return_date'] = timezone.now().date()
            book.available_quantity = min(book.quantity, book.available_quantity + 1)
            book.save()
        # If reverting from Returned to Issued
        elif old_status == BorrowRecord.STATUS_RETURNED and new_status in [BorrowRecord.STATUS_ISSUED, BorrowRecord.STATUS_OVERDUE]:
            book.available_quantity = max(0, book.available_quantity - 1)
            book.save()

        return super().update(instance, validated_data)
