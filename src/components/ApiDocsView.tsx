import React, { useState } from 'react';
import {
  Code2,
  FileCode,
  Layers,
  Terminal,
  Send,
  Download,
  Copy,
  Check,
  FolderTree,
  GitBranch,
  Database,
  ExternalLink,
  BookOpen
} from 'lucide-react';

export const ApiDocsView: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'models' | 'serializers' | 'views' | 'urls' | 'settings'>('models');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPostman, setCopiedPostman] = useState(false);

  const copyToClipboard = (text: string, isPostman = false) => {
    navigator.clipboard.writeText(text);
    if (isPostman) {
      setCopiedPostman(true);
      setTimeout(() => setCopiedPostman(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const projectFolders = [
    {
      name: 'frontend/ (React + Vite + Tailwind)',
      desc: 'Client-side user interface layer',
      files: [
        { path: 'src/types/index.ts', role: 'TypeScript interfaces for Book, Member, BorrowRecord, and API contracts.' },
        { path: 'src/services/api.ts', role: 'HTTP client making REST API calls to the server with error normalization.' },
        { path: 'src/components/DashboardView.tsx', role: 'Analytics dashboard, circulation stats, and KPI overview.' },
        { path: 'src/components/BookManagement.tsx', role: 'Book catalog table, search, category filter, and CRUD modals.' },
        { path: 'src/components/MemberManagement.tsx', role: 'Student/Faculty membership management with active loan safeguards.' },
        { path: 'src/components/BorrowManagement.tsx', role: 'Circulation transactions, issuing, returns, and overdue tracking.' },
        { path: 'src/components/Navbar.tsx', role: 'Navigation header, college branding, and connection status.' },
      ],
    },
    {
      name: 'backend/ (Python + Django + DRF)',
      desc: 'Server-side REST API and business logic layer',
      files: [
        { path: 'backend/manage.py', role: 'Django CLI entry point for migrations, test server, and superuser admin.' },
        { path: 'backend/requirements.txt', role: 'Python dependencies (Django, djangorestframework, django-cors-headers).' },
        { path: 'backend/library_project/settings.py', role: 'Configures SQLite database (db.sqlite3), CORS, and DRF serializers.' },
        { path: 'backend/library_project/urls.py', role: 'Root URL routing configuration directing /api/ traffic.' },
        { path: 'backend/api/models.py', role: 'Django ORM models: Book, Member, and BorrowRecord with constraints.' },
        { path: 'backend/api/serializers.py', role: 'DRF ModelSerializers with stock decrement/increment validation.' },
        { path: 'backend/api/views.py', role: 'DRF ModelViewSets for CRUD, search, filter, and dashboard metrics.' },
        { path: 'backend/api/urls.py', role: 'DefaultRouter generating RESTful endpoints (/books/, /members/, /borrow-records/).' },
        { path: 'backend/api/admin.py', role: 'Django Admin registration for web-based staff record management.' },
        { path: 'backend/postman_collection.json', role: 'Ready-to-import Postman test suite covering all CRUD endpoints.' },
      ],
    },
  ];

  const pythonCodeSnippets = {
    models: `# backend/api/models.py
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError

class Book(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    isbn = models.CharField(max_length=20, unique=True)
    category = models.CharField(max_length=100, default='General')
    publisher = models.CharField(max_length=255)
    publication_year = models.PositiveIntegerField()
    quantity = models.PositiveIntegerField(default=1)
    available_quantity = models.PositiveIntegerField(default=1)

    def clean(self):
        if self.available_quantity > self.quantity:
            raise ValidationError("Available quantity cannot exceed total quantity.")

    def __str__(self):
        return f"{self.title} by {self.author} ({self.isbn})"

class Member(models.Model):
    member_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    department = models.CharField(max_length=100)
    registration_date = models.DateField(default=timezone.now)

    def __str__(self):
        return f"{self.name} ({self.member_id})"

class BorrowRecord(models.Model):
    STATUS_CHOICES = [
        ('Issued', 'Issued'),
        ('Returned', 'Returned'),
        ('Overdue', 'Overdue'),
    ]
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='borrow_records')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='borrow_records')
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Issued')`,

    serializers: `# backend/api/serializers.py
from rest_framework import serializers
from django.utils import timezone
from .models import Book, Member, BorrowRecord

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'

    def validate_publication_year(self, value):
        current_year = timezone.now().year
        if value < 1000 or value > current_year:
            raise serializers.ValidationError(f"Publication year must be between 1000 and {current_year}.")
        return value

class MemberSerializer(serializers.ModelSerializer):
    active_borrows_count = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = ['id', 'member_id', 'name', 'email', 'phone', 'department', 'registration_date', 'active_borrows_count']

    def get_active_borrows_count(self, obj):
        return obj.borrow_records.filter(status__in=['Issued', 'Overdue']).count()

class BorrowRecordReadSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    member = MemberSerializer(read_only=True)

    class Meta:
        model = BorrowRecord
        fields = ['id', 'book', 'member', 'issue_date', 'due_date', 'return_date', 'status']

class BorrowRecordWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BorrowRecord
        fields = ['id', 'book', 'member', 'issue_date', 'due_date', 'return_date', 'status']

    def create(self, validated_data):
        book = validated_data['book']
        if book.available_quantity <= 0:
            raise serializers.ValidationError({"book": "No copies available for issue."})
        # Auto-decrement stock
        book.available_quantity -= 1
        book.save()
        return super().create(validated_data)`,

    views: `# backend/api/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from .models import Book, Member, BorrowRecord
from .serializers import BookSerializer, MemberSerializer, BorrowRecordReadSerializer, BorrowRecordWriteSerializer

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all().order_by('-id')
    serializer_class = BookSerializer

class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all().order_by('-id')
    serializer_class = MemberSerializer

class BorrowRecordViewSet(viewsets.ModelViewSet):
    queryset = BorrowRecord.objects.all().select_related('book', 'member')

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return BorrowRecordReadSerializer
        return BorrowRecordWriteSerializer

    @action(detail=True, methods=['post'])
    def mark_returned(self, request, pk=None):
        record = self.get_object()
        record.status = 'Returned'
        record.return_date = timezone.now().date()
        record.save()
        # Restore copy to library stock
        record.book.available_quantity += 1
        record.book.save()
        return Response(BorrowRecordReadSerializer(record).data)`,

    urls: `# backend/api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookViewSet, MemberViewSet, BorrowRecordViewSet, DashboardStatsView

router = DefaultRouter()
router.register(r'books', BookViewSet)
router.register(r'members', MemberViewSet)
router.register(r'borrow-records', BorrowRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]`,

    settings: `# backend/library_project/settings.py snippet
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

CORS_ALLOW_ALL_ORIGINS = True`,
  };

  const samplePostmanJson = `{
  "info": {
    "name": "Library Management System API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    { "name": "List Books", "request": { "method": "GET", "url": "http://127.0.0.1:8000/api/books/" } },
    { "name": "Create Book", "request": { "method": "POST", "url": "http://127.0.0.1:8000/api/books/" } },
    { "name": "List Members", "request": { "method": "GET", "url": "http://127.0.0.1:8000/api/members/" } },
    { "name": "Issue Book", "request": { "method": "POST", "url": "http://127.0.0.1:8000/api/borrow-records/" } },
    { "name": "Return Book", "request": { "method": "POST", "url": "http://127.0.0.1:8000/api/borrow-records/1/return/" } }
  ]
}`;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Code2 className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-wider">Architecture & API Documentation</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Full-Stack Architecture & College Submission Guide
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              This application is designed following clean software engineering principles. It separates the React client-side presentation layer from the Django REST Framework backend with SQLite ORM persistence.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => copyToClipboard(samplePostmanJson, true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              {copiedPostman ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedPostman ? 'Copied Collection!' : 'Copy Postman JSON'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Architecture Flowchart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <span>System Flow & Communication Architecture</span>
        </h3>

        <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed">
          <pre className="text-indigo-300">
{`┌─────────────────────────────────────────────────────────────┐
│                      REACT FRONTEND                         │
│   • DashboardView.tsx   • BookManagement.tsx                │
│   • MemberManagement.tsx • BorrowManagement.tsx             │
└──────────────────────────────┬──────────────────────────────┘
                               │  HTTP / JSON (REST API)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 DJANGO REST FRAMEWORK (DRF)                 │
│   • api/views.py        -> ModelViewSets                    │
│   • api/serializers.py  -> JSON serialization & validation  │
│   • api/urls.py         -> RESTful Router endpoints         │
└──────────────────────────────┬──────────────────────────────┘
                               │  Django ORM Queries
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       SQLITE DATABASE                       │
│   • Table: books          (title, author, isbn, stock...)   │
│   • Table: members        (member_id, name, email...)       │
│   • Table: borrow_records (FK book, FK member, dates...)    │
└─────────────────────────────────────────────────────────────┘`}
          </pre>
        </div>
      </div>

      {/* Project Structure Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projectFolders.map((section) => (
          <div key={section.name} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-1">
              <FolderTree className="w-5 h-5 text-indigo-600" />
              <h4 className="font-bold text-slate-900 text-sm">{section.name}</h4>
            </div>
            <p className="text-xs text-slate-500 mb-4">{section.desc}</p>

            <div className="space-y-2">
              {section.files.map((f) => (
                <div key={f.path} className="p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-100">
                  <div className="font-mono font-semibold text-indigo-700">{f.path}</div>
                  <div className="text-slate-600 mt-0.5">{f.role}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Django REST Framework Source Viewer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-600" />
            <h4 className="font-bold text-slate-900 text-sm">Django REST Framework Source Code (Python)</h4>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {(['models', 'serializers', 'views', 'urls', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCodeTab(tab)}
                className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors ${
                  activeCodeTab === tab
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {tab}.py
              </button>
            ))}
          </div>
        </div>

        <div className="relative p-4 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto">
          <button
            onClick={() => copyToClipboard(pythonCodeSnippets[activeCodeTab])}
            className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
          </button>
          <pre className="leading-relaxed">{pythonCodeSnippets[activeCodeTab]}</pre>
        </div>
      </div>

      {/* REST API Endpoints Catalog */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Send className="w-5 h-5 text-indigo-600" />
          <span>REST API Endpoints Specification</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-xs border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5">Method</th>
                <th className="px-3 py-2.5">Endpoint URL</th>
                <th className="px-3 py-2.5">Operation Description</th>
                <th className="px-3 py-2.5">Payload / Params</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200">GET</span></td>
                <td className="px-3 py-2.5 font-mono text-slate-900">/api/books/</td>
                <td className="px-3 py-2.5 text-slate-600">Retrieve all books with optional search/category filter</td>
                <td className="px-3 py-2.5 text-slate-500 font-mono text-xs">?search=...&category=...</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">POST</span></td>
                <td className="px-3 py-2.5 font-mono text-slate-900">/api/books/</td>
                <td className="px-3 py-2.5 text-slate-600">Add a new book with ISBN, category, and stock counts</td>
                <td className="px-3 py-2.5 text-slate-500 font-mono text-xs">&#123; title, author, isbn, quantity... &#125;</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-amber-50 text-amber-700 border border-amber-200">PUT</span></td>
                <td className="px-3 py-2.5 font-mono text-slate-900">/api/books/:id/</td>
                <td className="px-3 py-2.5 text-slate-600">Update an existing book record</td>
                <td className="px-3 py-2.5 text-slate-500 font-mono text-xs">&#123; title, author, isbn... &#125;</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-rose-50 text-rose-700 border border-rose-200">DELETE</span></td>
                <td className="px-3 py-2.5 font-mono text-slate-900">/api/books/:id/</td>
                <td className="px-3 py-2.5 text-slate-600">Delete a book from library inventory</td>
                <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">None</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200">GET</span></td>
                <td className="px-3 py-2.5 font-mono text-slate-900">/api/members/</td>
                <td className="px-3 py-2.5 text-slate-600">List all registered library members</td>
                <td className="px-3 py-2.5 text-slate-500 font-mono text-xs">?department=...&search=...</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">POST</span></td>
                <td className="px-3 py-2.5 font-mono text-slate-900">/api/members/</td>
                <td className="px-3 py-2.5 text-slate-600">Register new member (student or faculty)</td>
                <td className="px-3 py-2.5 text-slate-500 font-mono text-xs">&#123; member_id, name, email, phone... &#125;</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">POST</span></td>
                <td className="px-3 py-2.5 font-mono text-slate-900">/api/borrow-records/</td>
                <td className="px-3 py-2.5 text-slate-600">Issue book to member (auto-decrements stock)</td>
                <td className="px-3 py-2.5 text-slate-500 font-mono text-xs">&#123; book: 1, member: 2, due_date &#125;</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">POST</span></td>
                <td className="px-3 py-2.5 font-mono text-slate-900">/api/borrow-records/:id/return/</td>
                <td className="px-3 py-2.5 text-slate-600">Return book (auto-increments available stock)</td>
                <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">None</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200">GET</span></td>
                <td className="px-3 py-2.5 font-mono text-slate-900">/api/dashboard/stats/</td>
                <td className="px-3 py-2.5 text-slate-600">Fetch catalog summaries, active loans, and overdue counts</td>
                <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">None</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Git & GitHub Submission Guide */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-indigo-600" />
          <span>College Git & GitHub Version Control Instructions</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          To submit this project to GitHub for college coursework evaluation:
        </p>

        <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs space-y-2">
          <div className="text-slate-400"># 1. Initialize local repository</div>
          <div className="text-emerald-400">git init</div>
          <div className="text-slate-400"># 2. Stage all frontend and backend source files</div>
          <div className="text-emerald-400">git add .</div>
          <div className="text-slate-400"># 3. Commit with a meaningful college project message</div>
          <div className="text-emerald-400">git commit -m "feat: complete full-stack Library Management System with React, DRF, and SQLite"</div>
          <div className="text-slate-400"># 4. Link your GitHub remote repository and push</div>
          <div className="text-emerald-400">git remote add origin https://github.com/&lt;your-username&gt;/library-management-system.git</div>
          <div className="text-emerald-400">git branch -M main</div>
          <div className="text-emerald-400">git push -u origin main</div>
        </div>
      </div>
    </div>
  );
};
