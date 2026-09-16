import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
const DB_DIR = path.join(process.cwd(), 'database');
const DB_FILE = path.join(DB_DIR, 'library.sqlite');

export interface BookRecord {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  publisher: string;
  publication_year: number;
  quantity: number;
  available_quantity: number;
}

export interface MemberRecord {
  id: number;
  member_id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  registration_date: string;
}

export interface BorrowRecordItem {
  id: number;
  book_id: number;
  member_id: number;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: 'Issued' | 'Returned' | 'Overdue';
  book?: BookRecord;
  member?: MemberRecord;
  is_overdue?: boolean;
}

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  initTables(dbInstance);
  persistDb();
  return dbInstance;
}

function persistDb() {
  if (!dbInstance) return;
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

function initTables(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      isbn TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      publisher TEXT,
      publication_year INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      available_quantity INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      department TEXT NOT NULL,
      registration_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS borrow_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      return_date TEXT,
      status TEXT NOT NULL DEFAULT 'Issued',
      FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
    );
  `);

  // Seed initial data if books table is empty
  const countRes = db.exec("SELECT COUNT(*) AS c FROM books");
  const count = (countRes[0]?.values[0]?.[0] as number) || 0;

  if (count === 0) {
    seedDatabase(db);
  }
}

function seedDatabase(db: Database) {
  // Initial Books
  const books = [
    ['Introduction to Algorithms', 'Thomas H. Cormen', '978-0262033848', 'Computer Science', 'MIT Press', 2009, 6, 4],
    ['Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', '978-0132350884', 'Computer Science', 'Prentice Hall', 2008, 5, 3],
    ['Design Patterns: Elements of Reusable Object-Oriented Software', 'Erich Gamma et al.', '978-0201633610', 'Computer Science', 'Addison-Wesley', 1994, 4, 3],
    ['Computer Networking: A Top-Down Approach', 'James F. Kurose', '978-0133594140', 'Information Technology', 'Pearson', 2017, 5, 5],
    ['Artificial Intelligence: A Modern Approach', 'Stuart Russell & Peter Norvig', '978-0136042594', 'Computer Science', 'Pearson', 2020, 4, 3],
    ['Modern Control Engineering', 'Katsuhiko Ogata', '978-0136156734', 'Electronics', 'Prentice Hall', 2010, 3, 2],
    ['Engineering Mechanics: Statics & Dynamics', 'R. C. Hibbeler', '978-0133915426', 'Mechanical', 'Pearson', 2016, 4, 4],
    ['Discrete Mathematics and Its Applications', 'Kenneth H. Rosen', '978-0073383095', 'Mathematics', 'McGraw-Hill', 2012, 6, 5],
  ];

  for (const b of books) {
    db.run(
      `INSERT INTO books (title, author, isbn, category, publisher, publication_year, quantity, available_quantity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      b
    );
  }

  // Initial Members
  const members = [
    ['LIB-2026-001', 'Alex Rivera', 'alex.rivera@college.edu', '+1 (555) 234-5678', 'Computer Science', '2026-01-15'],
    ['LIB-2026-002', 'Sophia Chen', 'sophia.chen@college.edu', '+1 (555) 345-6789', 'Information Technology', '2026-01-18'],
    ['LIB-2026-003', 'Marcus Johnson', 'm.johnson@college.edu', '+1 (555) 456-7890', 'Mechanical', '2026-02-01'],
    ['LIB-2026-004', 'Emily Rodriguez', 'emily.rodriguez@college.edu', '+1 (555) 567-8901', 'Electronics', '2026-02-10'],
    ['LIB-2026-005', 'Dr. Alan Turing (Faculty)', 'alan.turing@college.edu', '+1 (555) 678-9012', 'Computer Science', '2025-08-20'],
  ];

  for (const m of members) {
    db.run(
      `INSERT INTO members (member_id, name, email, phone, department, registration_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      m
    );
  }

  // Initial Borrow Records
  // Record 1: Issued (active)
  // Record 2: Overdue
  // Record 3: Returned
  const today = new Date();
  const pastIssueDate = new Date(today);
  pastIssueDate.setDate(today.getDate() - 25);
  const pastDueDate = new Date(today);
  pastDueDate.setDate(today.getDate() - 11);

  const recentIssueDate = new Date(today);
  recentIssueDate.setDate(today.getDate() - 4);
  const upcomingDueDate = new Date(today);
  upcomingDueDate.setDate(today.getDate() + 10);

  const returnedIssueDate = new Date(today);
  returnedIssueDate.setDate(today.getDate() - 20);
  const returnedDueDate = new Date(today);
  returnedDueDate.setDate(today.getDate() - 6);
  const returnedDate = new Date(today);
  returnedDate.setDate(today.getDate() - 7);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const records = [
    [1, 1, formatDate(recentIssueDate), formatDate(upcomingDueDate), null, 'Issued'],
    [2, 2, formatDate(pastIssueDate), formatDate(pastDueDate), null, 'Overdue'],
    [3, 3, formatDate(returnedIssueDate), formatDate(returnedDueDate), formatDate(returnedDate), 'Returned'],
    [5, 4, formatDate(recentIssueDate), formatDate(upcomingDueDate), null, 'Issued'],
    [6, 5, formatDate(recentIssueDate), formatDate(upcomingDueDate), null, 'Issued'],
  ];

  for (const r of records) {
    db.run(
      `INSERT INTO borrow_records (book_id, member_id, issue_date, due_date, return_date, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      r
    );
  }
}

// ---------------- Database Query Helpers ----------------

export async function getAllBooks(search?: string, category?: string, availableOnly?: boolean): Promise<BookRecord[]> {
  const db = await getDb();
  let sql = "SELECT * FROM books WHERE 1=1";
  const params: (string | number)[] = [];

  if (search && search.trim()) {
    sql += " AND (title LIKE ? OR author LIKE ? OR isbn LIKE ? OR publisher LIKE ?)";
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  if (category && category !== 'All') {
    sql += " AND category = ?";
    params.push(category);
  }

  if (availableOnly) {
    sql += " AND available_quantity > 0";
  }

  sql += " ORDER BY id DESC";

  const stmt = db.prepare(sql);
  stmt.bind(params);
  const books: BookRecord[] = [];
  while (stmt.step()) {
    books.push(stmt.getAsObject() as unknown as BookRecord);
  }
  stmt.free();
  return books;
}

export async function getBookById(id: number): Promise<BookRecord | null> {
  const db = await getDb();
  const stmt = db.prepare("SELECT * FROM books WHERE id = ?");
  stmt.bind([id]);
  let book: BookRecord | null = null;
  if (stmt.step()) {
    book = stmt.getAsObject() as unknown as BookRecord;
  }
  stmt.free();
  return book;
}

export async function createBook(book: Omit<BookRecord, 'id'>): Promise<BookRecord> {
  const db = await getDb();
  db.run(
    `INSERT INTO books (title, author, isbn, category, publisher, publication_year, quantity, available_quantity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      book.title,
      book.author,
      book.isbn,
      book.category,
      book.publisher,
      book.publication_year,
      book.quantity,
      book.available_quantity,
    ]
  );
  persistDb();
  const res = db.exec("SELECT last_insert_rowid() AS id");
  const newId = res[0].values[0][0] as number;
  return (await getBookById(newId))!;
}

export async function updateBook(id: number, book: Partial<BookRecord>): Promise<BookRecord | null> {
  const db = await getDb();
  const current = await getBookById(id);
  if (!current) return null;

  const title = book.title ?? current.title;
  const author = book.author ?? current.author;
  const isbn = book.isbn ?? current.isbn;
  const category = book.category ?? current.category;
  const publisher = book.publisher ?? current.publisher;
  const publication_year = book.publication_year ?? current.publication_year;
  const quantity = book.quantity ?? current.quantity;
  const available_quantity = book.available_quantity ?? current.available_quantity;

  db.run(
    `UPDATE books SET title = ?, author = ?, isbn = ?, category = ?, publisher = ?, publication_year = ?, quantity = ?, available_quantity = ?
     WHERE id = ?`,
    [title, author, isbn, category, publisher, publication_year, quantity, available_quantity, id]
  );
  persistDb();
  return getBookById(id);
}

export async function deleteBook(id: number): Promise<boolean> {
  const db = await getDb();
  db.run("DELETE FROM books WHERE id = ?", [id]);
  persistDb();
  return true;
}

// ---------------- Member Query Helpers ----------------

export async function getAllMembers(search?: string, department?: string): Promise<(MemberRecord & { active_borrows_count: number })[]> {
  const db = await getDb();
  let sql = "SELECT * FROM members WHERE 1=1";
  const params: (string | number)[] = [];

  if (search && search.trim()) {
    sql += " AND (name LIKE ? OR member_id LIKE ? OR email LIKE ? OR phone LIKE ?)";
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  if (department && department !== 'All') {
    sql += " AND department = ?";
    params.push(department);
  }

  sql += " ORDER BY id DESC";

  const stmt = db.prepare(sql);
  stmt.bind(params);
  const members: (MemberRecord & { active_borrows_count: number })[] = [];
  while (stmt.step()) {
    const m = stmt.getAsObject() as unknown as MemberRecord;
    // Count active loans
    const loanStmt = db.prepare("SELECT COUNT(*) AS c FROM borrow_records WHERE member_id = ? AND status IN ('Issued', 'Overdue')");
    loanStmt.bind([m.id]);
    let activeLoans = 0;
    if (loanStmt.step()) {
      activeLoans = loanStmt.getAsObject().c as number;
    }
    loanStmt.free();
    members.push({ ...m, active_borrows_count: activeLoans });
  }
  stmt.free();
  return members;
}

export async function getMemberById(id: number): Promise<MemberRecord | null> {
  const db = await getDb();
  const stmt = db.prepare("SELECT * FROM members WHERE id = ?");
  stmt.bind([id]);
  let member: MemberRecord | null = null;
  if (stmt.step()) {
    member = stmt.getAsObject() as unknown as MemberRecord;
  }
  stmt.free();
  return member;
}

export async function createMember(member: Omit<MemberRecord, 'id'>): Promise<MemberRecord> {
  const db = await getDb();
  db.run(
    `INSERT INTO members (member_id, name, email, phone, department, registration_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [member.member_id, member.name, member.email, member.phone, member.department, member.registration_date]
  );
  persistDb();
  const res = db.exec("SELECT last_insert_rowid() AS id");
  const newId = res[0].values[0][0] as number;
  return (await getMemberById(newId))!;
}

export async function updateMember(id: number, member: Partial<MemberRecord>): Promise<MemberRecord | null> {
  const db = await getDb();
  const current = await getMemberById(id);
  if (!current) return null;

  const member_id = member.member_id ?? current.member_id;
  const name = member.name ?? current.name;
  const email = member.email ?? current.email;
  const phone = member.phone ?? current.phone;
  const department = member.department ?? current.department;
  const registration_date = member.registration_date ?? current.registration_date;

  db.run(
    `UPDATE members SET member_id = ?, name = ?, email = ?, phone = ?, department = ?, registration_date = ?
     WHERE id = ?`,
    [member_id, name, email, phone, department, registration_date, id]
  );
  persistDb();
  return getMemberById(id);
}

export async function deleteMember(id: number): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  // Check active loans
  const loanStmt = db.prepare("SELECT COUNT(*) AS c FROM borrow_records WHERE member_id = ? AND status IN ('Issued', 'Overdue')");
  loanStmt.bind([id]);
  let activeLoans = 0;
  if (loanStmt.step()) {
    activeLoans = loanStmt.getAsObject().c as number;
  }
  loanStmt.free();

  if (activeLoans > 0) {
    return { success: false, error: `Cannot delete member with ${activeLoans} active unreturned book(s).` };
  }

  db.run("DELETE FROM members WHERE id = ?", [id]);
  persistDb();
  return { success: true };
}

// ---------------- Borrow Record Query Helpers ----------------

export async function getAllBorrowRecords(statusFilter?: string, search?: string): Promise<BorrowRecordItem[]> {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];

  // Auto-update overdue records
  db.run("UPDATE borrow_records SET status = 'Overdue' WHERE status = 'Issued' AND due_date < ?", [today]);
  persistDb();

  let sql = `
    SELECT br.*, 
           b.title as book_title, b.author as book_author, b.isbn as book_isbn, b.category as book_category,
           m.name as member_name, m.member_id as member_code, m.email as member_email, m.department as member_dept
    FROM borrow_records br
    JOIN books b ON br.book_id = b.id
    JOIN members m ON br.member_id = m.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (statusFilter && statusFilter !== 'All') {
    sql += " AND br.status = ?";
    params.push(statusFilter);
  }

  if (search && search.trim()) {
    sql += " AND (b.title LIKE ? OR b.isbn LIKE ? OR m.name LIKE ? OR m.member_id LIKE ?)";
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  sql += " ORDER BY br.id DESC";

  const stmt = db.prepare(sql);
  stmt.bind(params);
  const records: BorrowRecordItem[] = [];
  while (stmt.step()) {
    const raw = stmt.getAsObject() as Record<string, any>;
    const is_overdue = raw.status === 'Overdue' || (raw.status === 'Issued' && raw.due_date < today);
    records.push({
      id: raw.id,
      book_id: raw.book_id,
      member_id: raw.member_id,
      issue_date: raw.issue_date,
      due_date: raw.due_date,
      return_date: raw.return_date || null,
      status: raw.status,
      is_overdue,
      book: {
        id: raw.book_id,
        title: raw.book_title,
        author: raw.book_author,
        isbn: raw.book_isbn,
        category: raw.book_category,
        publisher: '',
        publication_year: 0,
        quantity: 0,
        available_quantity: 0,
      },
      member: {
        id: raw.member_id,
        member_id: raw.member_code,
        name: raw.member_name,
        email: raw.member_email,
        phone: '',
        department: raw.member_dept,
        registration_date: '',
      },
    });
  }
  stmt.free();
  return records;
}

export async function createBorrowRecord(data: {
  book_id: number;
  member_id: number;
  issue_date: string;
  due_date: string;
}): Promise<{ success: boolean; record?: BorrowRecordItem; error?: string }> {
  const db = await getDb();
  const book = await getBookById(data.book_id);
  if (!book) return { success: false, error: "Book not found." };
  if (book.available_quantity <= 0) {
    return { success: false, error: `No copies of '${book.title}' are currently available.` };
  }

  const member = await getMemberById(data.member_id);
  if (!member) return { success: false, error: "Member not found." };

  const today = new Date().toISOString().split('T')[0];
  let initialStatus: 'Issued' | 'Overdue' = 'Issued';
  if (data.due_date < today) {
    initialStatus = 'Overdue';
  }

  // Insert borrow record
  db.run(
    `INSERT INTO borrow_records (book_id, member_id, issue_date, due_date, return_date, status)
     VALUES (?, ?, ?, ?, NULL, ?)`,
    [data.book_id, data.member_id, data.issue_date, data.due_date, initialStatus]
  );

  // Decrement book available_quantity
  db.run(
    "UPDATE books SET available_quantity = available_quantity - 1 WHERE id = ?",
    [data.book_id]
  );

  persistDb();

  const allRecords = await getAllBorrowRecords();
  return { success: true, record: allRecords[0] };
}

export async function returnBorrowRecord(recordId: number): Promise<{ success: boolean; record?: BorrowRecordItem; error?: string }> {
  const db = await getDb();
  const stmt = db.prepare("SELECT * FROM borrow_records WHERE id = ?");
  stmt.bind([recordId]);
  let current: any = null;
  if (stmt.step()) {
    current = stmt.getAsObject();
  }
  stmt.free();

  if (!current) {
    return { success: false, error: "Borrow record not found." };
  }

  if (current.status === 'Returned') {
    return { success: false, error: "Book has already been returned." };
  }

  const today = new Date().toISOString().split('T')[0];

  // Mark record as returned
  db.run(
    "UPDATE borrow_records SET status = 'Returned', return_date = ? WHERE id = ?",
    [today, recordId]
  );

  // Increment book available quantity up to total quantity
  db.run(
    "UPDATE books SET available_quantity = MIN(quantity, available_quantity + 1) WHERE id = ?",
    [current.book_id]
  );

  persistDb();

  const all = await getAllBorrowRecords();
  const updated = all.find((r) => r.id === recordId);
  return { success: true, record: updated };
}

export async function deleteBorrowRecord(recordId: number): Promise<boolean> {
  const db = await getDb();
  // If active, restore book available quantity
  const stmt = db.prepare("SELECT * FROM borrow_records WHERE id = ?");
  stmt.bind([recordId]);
  if (stmt.step()) {
    const rec = stmt.getAsObject();
    if (rec.status === 'Issued' || rec.status === 'Overdue') {
      db.run("UPDATE books SET available_quantity = MIN(quantity, available_quantity + 1) WHERE id = ?", [rec.book_id]);
    }
  }
  stmt.free();

  db.run("DELETE FROM borrow_records WHERE id = ?", [recordId]);
  persistDb();
  return true;
}

// ---------------- Dashboard Statistics Helper ----------------

export async function getDashboardStats() {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];

  // Sync overdue
  db.run("UPDATE borrow_records SET status = 'Overdue' WHERE status = 'Issued' AND due_date < ?", [today]);
  persistDb();

  const bookCounts = db.exec("SELECT COUNT(*) AS total_books, SUM(quantity) AS total_copies, SUM(available_quantity) AS available_copies FROM books")[0]?.values[0] || [0, 0, 0];
  const totalBooks = (bookCounts[0] as number) || 0;
  const totalCopies = (bookCounts[1] as number) || 0;
  const availableCopies = (bookCounts[2] as number) || 0;
  const borrowedCopies = Math.max(0, totalCopies - availableCopies);

  const memberCount = (db.exec("SELECT COUNT(*) FROM members")[0]?.values[0]?.[0] as number) || 0;

  const borrowCounts = db.exec(`
    SELECT 
      SUM(CASE WHEN status = 'Issued' THEN 1 ELSE 0 END) AS active_borrows,
      SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) AS overdue_borrows,
      SUM(CASE WHEN status = 'Returned' THEN 1 ELSE 0 END) AS returned_borrows
    FROM borrow_records
  `)[0]?.values[0] || [0, 0, 0];

  const activeBorrows = (borrowCounts[0] as number) || 0;
  const overdueBorrows = (borrowCounts[1] as number) || 0;
  const returnedBorrows = (borrowCounts[2] as number) || 0;

  // Category distribution
  const catStmt = db.prepare("SELECT category, COUNT(*) as count, SUM(quantity) as total_copies FROM books GROUP BY category ORDER BY count DESC LIMIT 6");
  const categories: { category: string; count: number; total_copies: number }[] = [];
  while (catStmt.step()) {
    categories.push(catStmt.getAsObject() as any);
  }
  catStmt.free();

  const recentBorrows = await getAllBorrowRecords();

  return {
    total_books: totalBooks,
    total_copies: totalCopies,
    available_copies: availableCopies,
    borrowed_copies: borrowedCopies,
    total_members: memberCount,
    active_borrows: activeBorrows,
    overdue_borrows: overdueBorrows,
    returned_borrows: returnedBorrows,
    categories,
    recent_borrows: recentBorrows.slice(0, 5),
  };
}
