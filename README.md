# Library Management System (LMS)

## 1. Project Title
**Library Management System** - A Full-Stack Web Application for University Libraries.

## 2. Project Overview
The Library Management System is a comprehensive, full-stack web application designed to digitalize and streamline the daily operations of a university or school library. It provides a centralized platform for administrators to manage book inventories, register library members, and track the real-time circulation (issuing and returning) of books.

## 3. Problem Statement
Traditional library management often relies on manual ledger books or fragmented spreadsheets. This approach is highly prone to human error, makes it difficult to track overdue books, results in lost inventory, and provides no real-time insights into library usage. There is a need for a unified, automated digital system to ensure data integrity and operational efficiency.

## 4. Objectives
*   To automate the cataloging and inventory management of books.
*   To maintain a secure and easily searchable registry of library members (students and faculty).
*   To streamline the book circulation process (issuing, returning, and tracking overdue records).
*   To provide administrators with real-time analytics and Key Performance Indicators (KPIs) through a dashboard.

## 5. Features
*   **Real-time Dashboard:** Displays total books, available copies, active loans, overdue items, and member statistics.
*   **Book Catalog Management:** Full Create, Read, Update, and Delete (CRUD) capabilities for the library's book inventory.
*   **Member Registry:** Manage student and faculty profiles, including contact information and department details.
*   **Circulation System:** Issue books to members, process returns, and automatically update available stock counts.
*   **Responsive UI:** A mobile-friendly, modern interface that works seamlessly on desktops, tablets, and smartphones.

## 6. Technology Stack
*   **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React (Icons).
*   **Backend:** Python, Django, Django REST Framework (DRF).
*   **Database:** SQLite.
*   **Communication:** RESTful API with JSON payloads.

## 7. System Architecture
The project follows a standard Client-Server architecture. The **React frontend** acts as a Single Page Application (SPA), handling the user interface and client-side routing. It communicates asynchronously via HTTP requests (`fetch`) to the **Django backend**, which serves as an API layer handling business logic, data validation, and database interactions.

## 8. Database Description
The SQLite database consists of three primary relational models:
*   `Book`: Stores inventory data (`title`, `author`, `isbn`, `category`, `publisher`, `quantity`, `available_quantity`).
*   `Member`: Stores user data (`name`, `member_id`, `email`, `phone`, `department`).
*   `BorrowRecord`: A transactional bridge table linking a `Book` and a `Member` via Foreign Keys. Tracks `issue_date`, `due_date`, `return_date`, and calculated `status`.

## 9. CRUD Operations
The system implements comprehensive CRUD operations across all entities:
*   **Create:** Register new members, add new books, and issue books (create borrow records).
*   **Read:** Fetch and display catalogs, member lists, and dashboard statistics.
*   **Update:** Edit member details, update book metadata, and mark books as returned.
*   **Delete:** Remove books, members, or circulation records (with safeguards against deleting members with active loans).

## 10. API Endpoints
*   **Books:** `GET /api/books/`, `POST /api/books/`, `PUT /api/books/:id/`, `DELETE /api/books/:id/`
*   **Members:** `GET /api/members/`, `POST /api/members/`, `PUT /api/members/:id/`, `DELETE /api/members/:id/`
*   **Circulation:** `GET /api/borrow-records/`, `POST /api/borrow-records/`, `POST /api/borrow-records/:id/return/`, `DELETE /api/borrow-records/:id/`
*   **Dashboard:** `GET /api/dashboard/stats/`

## 11. Validation
*   **Client-Side (React):** Form validations ensure required fields are filled, emails match standard regex patterns, and numeric inputs (like quantities and years) fall within logical bounds before submission.
*   **Server-Side (Django):** Enforces strict database integrity. Prevents duplicate ISBNs or Member IDs, blocks issuing books with zero available stock, and prevents deleting members who have unreturned books.

## 12. Testing
The application's backend API has been thoroughly tested using **Postman**. A complete Postman collection (`Library_Management_System.postman_collection.json`) is included in the project repository to test boundary conditions, validation errors, and successful data mutations.

## 13. Project Folder Structure
```text
library-management-system/
├── backend/                       # Django Backend
│   ├── api/                       # DRF App (Models, Views, Serializers, URLs)
│   ├── library_project/           # Core Django Settings
│   ├── manage.py                  # Django CLI
│   └── db.sqlite3                 # SQLite Database
├── src/                           # React Frontend
│   ├── components/                # Reusable UI Components & Views
│   ├── services/                  # API Integration (api.ts)
│   ├── types.ts                   # TypeScript Interfaces
│   ├── App.tsx                    # Main React Component
│   └── main.tsx                   # React Entry Point
├── package.json                   # Node Dependencies
├── tailwind.config.js             # Styling Configuration
└── Library_Management_System.postman_collection.json
```

## 14. Installation Requirements
*   **Node.js** (v18.0 or higher)
*   **Python** (v3.9 or higher)
*   **Git**

## 15. Backend Setup
Open a terminal and navigate to the `backend` directory:
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install django djangorestframework django-cors-headers
```

## 16. Frontend Setup
Open a new terminal at the root of the project:
```bash
npm install
```

## 17. Database Setup
With the backend virtual environment activated, prepare the database:
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## 18. How to Run the Application
You will need two terminal windows running simultaneously.

**Terminal 1 (Backend):**
```bash
cd backend
# Ensure venv is activated
python manage.py runserver 3000
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```
Navigate to the provided local URL (e.g., `http://localhost:5173`) in your web browser.

## 19. Sample API Requests
**Issuing a Book (POST `/api/borrow-records/`)**
```json
{
  "book": 1,
  "member": 3,
  "issue_date": "2026-09-14",
  "due_date": "2026-09-28"
}
```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "book": { "id": 1, "title": "Clean Code", "isbn": "9780132350884" },
  "member": { "id": 3, "name": "Alice Smith", "member_id": "STU-001" },
  "issue_date": "2026-09-14",
  "due_date": "2026-09-28",
  "return_date": null,
  "status": "Issued"
}
```

## 20. Challenges and Solutions
*   **Challenge:** Ensuring data consistency when deleting members. If a member is deleted while holding a book, the book stock is permanently lost.
*   **Solution:** Implemented server-side foreign key protection. The Django `MemberViewSet` actively intercepts `DELETE` requests, checks for active `BorrowRecords`, and returns a `400 Bad Request` with a friendly error message if the member still has unreturned books.
*   **Challenge:** Displaying complex server validation errors cleanly on the UI.
*   **Solution:** Built a global API response interceptor in the frontend that catches non-2xx HTTP codes, parses the deeply nested JSON error dictionaries from Django, flattens them into readable strings, and surfaces them via beautiful Toast notifications.

## 21. Future Enhancements
*   **Authentication & Authorization:** Add a secure login portal using JWT (JSON Web Tokens) to separate Admin, Librarian, and Student access roles.
*   **Barcode Integration:** Integrate a barcode scanning feature to quickly fetch member details or book ISBNs via webcam during the checkout process.
*   **Automated Email Notifications:** Integrate an SMTP service to automatically email students 24 hours before a book is due, and send overdue penalty notices.

## 22. GitHub Repository Information
*   **Author:** [Your Name Here]
*   **Course/Project:** [Your College Course / Project Name]
*   **Repository URL:** `[Insert your GitHub Repository URL here]`
*   **Clone Command:** `git clone [Insert your GitHub Repository URL here]`
