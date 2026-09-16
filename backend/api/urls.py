"""
URL configuration for the API app.
Uses Django REST Framework's DefaultRouter for automatic RESTful routing.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BookViewSet,
    MemberViewSet,
    BorrowRecordViewSet,
    DashboardStatsView,
)

router = DefaultRouter()
router.register(r'books', BookViewSet, basename='book')
router.register(r'members', MemberViewSet, basename='member')
router.register(r'borrow-records', BorrowRecordViewSet, basename='borrow-record')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
