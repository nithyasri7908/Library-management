import { Book, Member, BorrowRecord, DashboardStats } from '../types';

const BASE_URL = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (error) {
    throw new Error('Network error: Unable to connect to the backend server. Please check your connection.');
  }

  if (!res.ok) {
    let errorDetail = 'An error occurred while processing the request.';
    if (res.status >= 500) {
      errorDetail = 'Internal server error: The server encountered a problem. Please try again later.';
    } else if (res.status === 404) {
      errorDetail = 'Record not found: The requested item could not be found.';
    }

    try {
      const errorJson = await res.json();
      if (typeof errorJson === 'object' && errorJson !== null) {
        if (errorJson.detail) {
          errorDetail = errorJson.detail;
        } else {
          // Flatten field validation errors nicely e.g. { isbn: ["..."] }
          const messages = Object.entries(errorJson)
            .map(([field, msg]) => {
              const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ');
              return `${fieldName}: ${Array.isArray(msg) ? msg.join(', ') : msg}`;
            })
            .join(' | ');
          if (messages) errorDetail = messages;
        }
      }
    } catch {
      // Keep default errorDetail if JSON parsing fails
    }
    throw new Error(errorDetail);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  // Dashboard
  getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/dashboard/stats');
  },

  // Books CRUD
  getBooks(search?: string, category?: string, availableOnly?: boolean): Promise<Book[]> {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (category && category !== 'All') params.append('category', category);
    if (availableOnly) params.append('available_only', 'true');
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<Book[]>(`/books${qs}`);
  },

  getBook(id: number): Promise<Book> {
    return request<Book>(`/books/${id}`);
  },

  createBook(bookData: Omit<Book, 'id'>): Promise<Book> {
    return request<Book>('/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    });
  },

  updateBook(id: number, bookData: Partial<Book>): Promise<Book> {
    return request<Book>(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData),
    });
  },

  deleteBook(id: number): Promise<void> {
    return request<void>(`/books/${id}`, {
      method: 'DELETE',
    });
  },

  // Members CRUD
  getMembers(search?: string, department?: string): Promise<Member[]> {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (department && department !== 'All') params.append('department', department);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<Member[]>(`/members${qs}`);
  },

  getMember(id: number): Promise<Member> {
    return request<Member>(`/members/${id}`);
  },

  createMember(memberData: Omit<Member, 'id'>): Promise<Member> {
    return request<Member>('/members', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  },

  updateMember(id: number, memberData: Partial<Member>): Promise<Member> {
    return request<Member>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memberData),
    });
  },

  deleteMember(id: number): Promise<void> {
    return request<void>(`/members/${id}`, {
      method: 'DELETE',
    });
  },

  // Borrow Records
  getBorrowRecords(status?: string, search?: string): Promise<BorrowRecord[]> {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.append('status', status);
    if (search && search.trim()) params.append('search', search.trim());
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<BorrowRecord[]>(`/borrow-records${qs}`);
  },

  issueBook(data: { book: number; member: number; issue_date: string; due_date: string }): Promise<BorrowRecord> {
    return request<BorrowRecord>('/borrow-records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  returnBook(recordId: number): Promise<BorrowRecord> {
    return request<BorrowRecord>(`/borrow-records/${recordId}/return`, {
      method: 'POST',
    });
  },

  deleteBorrowRecord(recordId: number): Promise<void> {
    return request<void>(`/borrow-records/${recordId}`, {
      method: 'DELETE',
    });
  },
};
