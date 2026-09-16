"""
Django Admin Configuration for Library Management System.
Allows library administrators to inspect and manage records via /admin/.
"""

from django.contrib import admin
from .models import Book, Member, BorrowRecord


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'author', 'isbn', 'category', 'quantity', 'available_quantity', 'publication_year')
    list_filter = ('category', 'publication_year')
    search_fields = ('title', 'author', 'isbn', 'publisher')
    ordering = ('-id',)


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ('id', 'member_id', 'name', 'email', 'phone', 'department', 'registration_date')
    list_filter = ('department', 'registration_date')
    search_fields = ('name', 'member_id', 'email', 'phone')
    ordering = ('-id',)


@admin.register(BorrowRecord)
class BorrowRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'book', 'member', 'issue_date', 'due_date', 'return_date', 'status')
    list_filter = ('status', 'issue_date', 'due_date')
    search_fields = ('book__title', 'member__name', 'member__member_id')
    ordering = ('-issue_date',)
