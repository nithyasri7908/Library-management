import { Router, Request, Response } from 'express';
import {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  getAllBorrowRecords,
  createBorrowRecord,
  returnBorrowRecord,
  deleteBorrowRecord,
  getDashboardStats,
} from './db.js';

export const apiRouter = Router();

// ----------------- Books Endpoints -----------------

// GET /api/books/
apiRouter.get('/books', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const availableOnly = req.query.available_only === 'true';

    const books = await getAllBooks(search, category, availableOnly);
    res.json(books);
  } catch (err: any) {
    res.status(500).json({ detail: err.message || 'Internal server error' });
  }
});

// GET /api/books/:id
apiRouter.get('/books/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ detail: 'Invalid book ID' });

    const book = await getBookById(id);
    if (!book) return res.status(404).json({ detail: 'Book not found' });

    res.json(book);
  } catch (err: any) {
    res.status(500).json({ detail: err.message || 'Internal server error' });
  }
});

// POST /api/books
apiRouter.post('/books', async (req: Request, res: Response) => {
  try {
    const {
      title,
      author,
      isbn,
      category,
      publisher,
      publication_year,
      quantity,
      available_quantity,
    } = req.body;

    // Validation
    if (!title || !author || !isbn || !publisher) {
      return res.status(400).json({ detail: 'Title, author, ISBN, and publisher are required.' });
    }

    const currentYear = new Date().getFullYear();
    const pubYear = Number(publication_year);
    if (isNaN(pubYear) || pubYear < 1000 || pubYear > currentYear) {
      return res.status(400).json({ detail: `Publication year must be between 1000 and ${currentYear}.` });
    }

    const qty = Number(quantity) || 1;
    if (qty < 1) {
      return res.status(400).json({ detail: 'Quantity must be at least 1.' });
    }

    const availQty = available_quantity !== undefined ? Number(available_quantity) : qty;
    if (availQty > qty) {
      return res.status(400).json({ detail: 'Available quantity cannot exceed total quantity.' });
    }
    if (availQty < 0) {
      return res.status(400).json({ detail: 'Available quantity cannot be negative.' });
    }

    const newBook = await createBook({
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.trim(),
      category: (category || 'General').trim(),
      publisher: publisher.trim(),
      publication_year: pubYear,
      quantity: qty,
      available_quantity: availQty,
    });

    res.status(201).json(newBook);
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE constraint failed: books.isbn')) {
      return res.status(409).json({ detail: 'A book with this ISBN already exists.' });
    }
    res.status(500).json({ detail: err.message || 'Error creating book' });
  }
});

// PUT /api/books/:id
apiRouter.put('/books/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ detail: 'Invalid book ID' });

    const existing = await getBookById(id);
    if (!existing) return res.status(404).json({ detail: 'Book not found' });

    const {
      title,
      author,
      isbn,
      category,
      publisher,
      publication_year,
      quantity,
      available_quantity,
    } = req.body;

    const currentYear = new Date().getFullYear();
    const pubYear = Number(publication_year);
    if (isNaN(pubYear) || pubYear < 1000 || pubYear > currentYear) {
      return res.status(400).json({ detail: `Publication year must be between 1000 and ${currentYear}.` });
    }

    const qty = Number(quantity) || existing.quantity;
    const availQty = available_quantity !== undefined ? Number(available_quantity) : existing.available_quantity;

    if (availQty > qty) {
      return res.status(400).json({ detail: 'Available quantity cannot exceed total quantity.' });
    }

    const updated = await updateBook(id, {
      title: title?.trim(),
      author: author?.trim(),
      isbn: isbn?.trim(),
      category: category?.trim(),
      publisher: publisher?.trim(),
      publication_year: pubYear,
      quantity: qty,
      available_quantity: availQty,
    });

    res.json(updated);
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE constraint failed: books.isbn')) {
      return res.status(409).json({ detail: 'A book with this ISBN already exists.' });
    }
    res.status(500).json({ detail: err.message || 'Error updating book' });
  }
});

// DELETE /api/books/:id
apiRouter.delete('/books/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ detail: 'Invalid book ID' });

    await deleteBook(id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ detail: err.message || 'Error deleting book' });
  }
});

// ----------------- Members Endpoints -----------------

// GET /api/members
apiRouter.get('/members', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const department = req.query.department as string | undefined;

    const members = await getAllMembers(search, department);
    res.json(members);
  } catch (err: any) {
    res.status(500).json({ detail: err.message || 'Internal server error' });
  }
});

// GET /api/members/:id
apiRouter.get('/members/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ detail: 'Invalid member ID' });

    const member = await getMemberById(id);
    if (!member) return res.status(404).json({ detail: 'Member not found' });

    res.json(member);
  } catch (err: any) {
    res.status(500).json({ detail: err.message || 'Internal server error' });
  }
});

// POST /api/members
apiRouter.post('/members', async (req: Request, res: Response) => {
  try {
    const { member_id, name, email, phone, department, registration_date } = req.body;

    if (!member_id || !name || !email || !phone || !department) {
      return res.status(400).json({ detail: 'All member fields are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ detail: 'Please enter a valid email address.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newMember = await createMember({
      member_id: member_id.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      department: department.trim(),
      registration_date: registration_date || todayStr,
    });

    res.status(201).json(newMember);
  } catch (err: any) {
    if (err.message && err.message.includes('members.member_id')) {
      return res.status(409).json({ detail: 'A member with this Member ID already exists.' });
    }
    res.status(500).json({ detail: err.message || 'Error creating member' });
  }
});

// PUT /api/members/:id
apiRouter.put('/members/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ detail: 'Invalid member ID' });

    const existing = await getMemberById(id);
    if (!existing) return res.status(404).json({ detail: 'Member not found' });

    const { member_id, name, email, phone, department, registration_date } = req.body;

    const updated = await updateMember(id, {
      member_id: member_id?.trim(),
      name: name?.trim(),
      email: email?.trim().toLowerCase(),
      phone: phone?.trim(),
      department: department?.trim(),
      registration_date,
    });

    res.json(updated);
  } catch (err: any) {
    if (err.message && err.message.includes('members.member_id')) {
      return res.status(409).json({ detail: 'A member with this Member ID already exists.' });
    }
    res.status(500).json({ detail: err.message || 'Error updating member' });
  }
});

// DELETE /api/members/:id
apiRouter.delete('/members/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ detail: 'Invalid member ID' });

    const result = await deleteMember(id);
    if (!result.success) {
      return res.status(400).json({ detail: result.error });
    }

    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ detail: err.message || 'Error deleting member' });
  }
});

// ----------------- Borrow Records Endpoints -----------------

// GET /api/borrow-records
apiRouter.get('/borrow-records', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const records = await getAllBorrowRecords(status, search);
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ detail: err.message || 'Internal server error' });
  }
});

// POST /api/borrow-records
apiRouter.post('/borrow-records', async (req: Request, res: Response) => {
  try {
    const { book, member, issue_date, due_date } = req.body;

    const bookId = Number(book);
    const memberId = Number(member);

    if (!bookId || !memberId || !due_date) {
      return res.status(400).json({ detail: 'Book, Member, and Due Date are required.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const issueDateStr = issue_date || todayStr;

    if (due_date < issueDateStr) {
      return res.status(400).json({ detail: 'Due date cannot be before issue date.' });
    }

    const result = await createBorrowRecord({
      book_id: bookId,
      member_id: memberId,
      issue_date: issueDateStr,
      due_date,
    });

    if (!result.success) {
      return res.status(400).json({ detail: result.error });
    }

    res.status(201).json(result.record);
  } catch (err: any) {
    res.status(500).json({ detail: err.message || 'Error creating borrow record' });
  }
});

// POST /api/borrow-records/:id/return/
apiRouter.post('/borrow-records/:id/return', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ detail: 'Invalid record ID' });

    const result = await returnBorrowRecord(id);
    if (!result.success) {
      return res.status(400).json({ detail: result.error });
    }

    res.json(result.record);
  } catch (err: any) {
    res.status(500).json({ detail: err.message || 'Error processing return' });
  }
});

// DELETE /api/borrow-records/:id
apiRouter.delete('/borrow-records/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ detail: 'Invalid record ID' });

    await deleteBorrowRecord(id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ detail: err.message || 'Error deleting borrow record' });
  }
});

// ----------------- Dashboard Stats Endpoint -----------------

// GET /api/dashboard/stats
apiRouter.get('/dashboard/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ detail: err.message || 'Internal server error' });
  }
});
