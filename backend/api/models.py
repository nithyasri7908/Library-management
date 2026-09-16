"""
Models for the Library Management System.

Entities:
1. Book - Represents books in the library catalog.
2. Member - Represents registered library students or faculty members.
3. BorrowRecord - Tracks issued, returned, and overdue book transactions.
"""

from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError


class Book(models.Model):
    """
    Represents a book in the library collection.
    Tracks total stock quantity as well as real-time available quantity.
    """
    CATEGORY_CHOICES = [
        ('Computer Science', 'Computer Science'),
        ('Information Technology', 'Information Technology'),
        ('Electronics', 'Electronics'),
        ('Mechanical', 'Mechanical'),
        ('Civil', 'Civil'),
        ('Mathematics', 'Mathematics'),
        ('Physics', 'Physics'),
        ('Literature', 'Literature'),
        ('Management', 'Management'),
        ('General', 'General'),
    ]

    title = models.CharField(max_length=255, help_text="Title of the book")
    author = models.CharField(max_length=255, help_text="Author name")
    isbn = models.CharField(max_length=20, unique=True, help_text="International Standard Book Number (ISBN)")
    category = models.CharField(max_length=100, default='General', help_text="Academic genre or department")
    publisher = models.CharField(max_length=255, null=True, blank=True, help_text="Publishing house")
    publication_year = models.PositiveIntegerField(help_text="Year of publication")
    quantity = models.PositiveIntegerField(default=1, help_text="Total copies owned by library")
    available_quantity = models.PositiveIntegerField(default=1, help_text="Available copies for borrowing")

    class Meta:
        ordering = ['-id']
        verbose_name = 'Book'
        verbose_name_plural = 'Books'

    def clean(self):
        if self.available_quantity > self.quantity:
            raise ValidationError("Available quantity cannot exceed total quantity.")

    def __str__(self):
        return f"{self.title} by {self.author} (ISBN: {self.isbn})"


class Member(models.Model):
    """
    Represents a registered library member (Student / Faculty).
    """
    DEPARTMENT_CHOICES = [
        ('Computer Science', 'Computer Science'),
        ('Information Technology', 'Information Technology'),
        ('Electrical Engineering', 'Electrical Engineering'),
        ('Mechanical Engineering', 'Mechanical Engineering'),
        ('Civil Engineering', 'Civil Engineering'),
        ('Business Administration', 'Business Administration'),
        ('Science & Humanities', 'Science & Humanities'),
    ]

    member_id = models.CharField(max_length=50, unique=True, help_text="Unique student/faculty ID e.g. LIB-2026-001")
    name = models.CharField(max_length=255, help_text="Full name of member")
    email = models.EmailField(unique=True, help_text="Email address")
    phone = models.CharField(max_length=20, help_text="Contact telephone number")
    department = models.CharField(max_length=100, help_text="Academic department")
    registration_date = models.DateField(auto_now_add=True, help_text="Date member registered in library")

    class Meta:
        ordering = ['-id']
        verbose_name = 'Member'
        verbose_name_plural = 'Members'

    def __str__(self):
        return f"{self.name} ({self.member_id})"


class BorrowRecord(models.Model):
    """
    Represents an issuance transaction of a book to a member.
    Status can be 'Issued', 'Returned', or 'Overdue'.
    """
    STATUS_ISSUED = 'Issued'
    STATUS_RETURNED = 'Returned'
    STATUS_OVERDUE = 'Overdue'

    STATUS_CHOICES = [
        (STATUS_ISSUED, 'Issued'),
        (STATUS_RETURNED, 'Returned'),
        (STATUS_OVERDUE, 'Overdue'),
    ]

    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='borrow_records',
        help_text="Borrowed book"
    )
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='borrow_records',
        help_text="Member who borrowed the book"
    )
    issue_date = models.DateField(default=timezone.now, help_text="Date book was issued")
    due_date = models.DateField(help_text="Scheduled due date for return")
    return_date = models.DateField(null=True, blank=True, help_text="Actual date returned")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ISSUED,
        help_text="Borrowing status"
    )

    class Meta:
        ordering = ['-issue_date', '-id']
        verbose_name = 'Borrow Record'
        verbose_name_plural = 'Borrow Records'

    def update_status_if_overdue(self):
        """
        Calculates whether an issued book is past its due date.
        """
        if self.status == self.STATUS_ISSUED and self.due_date < timezone.now().date():
            self.status = self.STATUS_OVERDUE
            self.save(update_fields=['status'])

    def __str__(self):
        return f"{self.book.title} issued to {self.member.name} [{self.status}]"
