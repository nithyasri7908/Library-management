export interface Book {
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

export interface Member {
  id: number;
  member_id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  registration_date: string;
  active_borrows_count?: number;
}

export type BorrowStatus = 'Issued' | 'Returned' | 'Overdue';

export interface BorrowRecord {
  id: number;
  book_id?: number;
  member_id?: number;
  book: {
    id: number;
    title: string;
    author: string;
    isbn: string;
    category?: string;
  };
  member: {
    id: number;
    member_id: string;
    name: string;
    email: string;
    department?: string;
  };
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: BorrowStatus;
  is_overdue?: boolean;
}

export interface DashboardStats {
  total_books: number;
  total_copies: number;
  available_copies: number;
  borrowed_copies: number;
  total_members: number;
  active_borrows: number;
  overdue_borrows: number;
  returned_borrows: number;
  categories: {
    category: string;
    count: number;
    total_copies: number;
  }[];
  recent_borrows: BorrowRecord[];
}

export type ActiveTab = 'dashboard' | 'books' | 'members' | 'borrows' | 'architecture';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
