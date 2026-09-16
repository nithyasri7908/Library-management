# Library Management System - Backend (Django REST Framework)

A college-level full-stack RESTful Library Management System backend built with **Python 3**, **Django**, and **Django REST Framework** connected to an **SQLite** database.

---

## 🏛️ Project Architecture

```
React Frontend (Vite / TypeScript)
      │
      ▼ HTTP (JSON)
REST API Endpoints (/api/...)
      │
      ▼
Django REST Framework (Views & Serializers)
      │
      ▼
Django ORM (Models & Validation)
      │
      ▼
SQLite Database (db.sqlite3)
```

---

## 📁 Directory Structure & File Responsibilities

| File / Folder | Purpose & Responsibility |
| :--- | :--- |
| `manage.py` | Django command-line execution utility for running servers, migrations, and shell. |
| `requirements.txt` | Python dependency manifest (`Django`, `djangorestframework`, `django-cors-headers`). |
| `library_project/settings.py` | Project settings: SQLite database, CORS headers for React, installed apps. |
| `library_project/urls.py` | Top-level URL routing table that mounts the `/api/` endpoints. |
| `api/models.py` | Database entity definitions: **Book**, **Member**, and **BorrowRecord**. |
| `api/serializers.py` | ModelSerializers for JSON serialization, deserialization, and stock business logic. |
| `api/views.py` | ViewSets handling full CRUD, search, category filtering, and status workflows. |
| `api/urls.py` | REST Framework routers registering `/api/books/`, `/api/members/`, and `/api/borrow-records/`. |
| `api/admin.py` | Administration panel configuration for library staff. |
| `postman_collection.json` | Ready-to-import Postman test collection with sample payloads and test requests. |

---

## 🚀 How to Run the Django Backend Locally

### 1. Create and Activate a Python Virtual Environment
```bash
# Windows:
python -m venv venv
venv\Scripts\activate

# macOS / Linux:
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. (Optional) Create an Admin Superuser
```bash
python manage.py createsuperuser
```

### 5. Start the Development Server
```bash
python manage.py runserver 8000
```
The REST API will be available at `http://127.0.0.1:8000/api/` and the Django Admin panel at `http://127.0.0.1:8000/admin/`.

---

## 📡 REST API Endpoints

### 1. Books (`/api/books/`)
- `GET /api/books/` - List all books (supports `?search=...`, `?category=...`, `?available_only=true`)
- `POST /api/books/` - Create a new book
- `GET /api/books/<id>/` - Retrieve a specific book
- `PUT /api/books/<id>/` - Update book details
- `DELETE /api/books/<id>/` - Remove book from collection

### 2. Members (`/api/members/`)
- `GET /api/members/` - List members (supports `?search=...`, `?department=...`)
- `POST /api/members/` - Register a new member
- `GET /api/members/<id>/` - Retrieve a specific member
- `PUT /api/members/<id>/` - Update member details
- `DELETE /api/members/<id>/` - Delete member (blocks deletion if active loans exist)

### 3. Borrow Records (`/api/borrow-records/`)
- `GET /api/borrow-records/` - List all borrowing transactions (supports `?status=Issued|Returned|Overdue`)
- `POST /api/borrow-records/` - Issue a book (auto-decrements book `available_quantity`)
- `POST /api/borrow-records/<id>/return/` - Mark book as returned (auto-increments `available_quantity`)
- `DELETE /api/borrow-records/<id>/` - Delete record

### 4. Dashboard Stats (`/api/dashboard/stats/`)
- `GET /api/dashboard/stats/` - Aggregate metrics for books, available copies, loans, and categories.
