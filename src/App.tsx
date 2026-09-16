import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardView } from './components/DashboardView';
import { BookManagement } from './components/BookManagement';
import { MemberManagement } from './components/MemberManagement';
import { BorrowManagement } from './components/BorrowManagement';
import { ApiDocsView } from './components/ApiDocsView';
import { Toast } from './components/Toast';
import { api } from './services/api';
import {
  ActiveTab,
  Book,
  Member,
  BorrowRecord,
  DashboardStats,
  ToastMessage,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverConnected, setServerConnected] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [preselectedBookId, setPreselectedBookId] = useState<number | null>(null);

  // Toast notification helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch all core datasets
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, booksData, membersData, borrowsData] = await Promise.all([
        api.getDashboardStats(),
        api.getBooks(),
        api.getMembers(),
        api.getBorrowRecords(),
      ]);

      setDashboardStats(statsData);
      setBooks(booksData);
      setMembers(membersData);
      setBorrowRecords(borrowsData);
      setServerConnected(true);
    } catch (err: any) {
      console.error('Data fetch error:', err);
      setServerConnected(false);
      showToast(err.message || 'Failed to connect to backend REST API.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Book CRUD Handlers
  const handleCreateBook = async (data: Omit<Book, 'id'>): Promise<boolean> => {
    try {
      const newBook = await api.createBook(data);
      showToast(`Book "${newBook.title}" registered successfully!`, 'success');
      loadAllData();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Error creating book record.', 'error');
      return false;
    }
  };

  const handleUpdateBook = async (id: number, data: Partial<Book>): Promise<boolean> => {
    try {
      const updated = await api.updateBook(id, data);
      showToast(`Book "${updated.title}" updated successfully!`, 'success');
      loadAllData();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Error updating book.', 'error');
      return false;
    }
  };

  const handleDeleteBook = async (id: number): Promise<boolean> => {
    try {
      await api.deleteBook(id);
      showToast('Book removed from library catalog.', 'info');
      loadAllData();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Error deleting book.', 'error');
      return false;
    }
  };

  // Member CRUD Handlers
  const handleCreateMember = async (data: Omit<Member, 'id'>): Promise<boolean> => {
    try {
      const newMember = await api.createMember(data);
      showToast(`Member "${newMember.name}" registered successfully!`, 'success');
      loadAllData();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Error registering member.', 'error');
      return false;
    }
  };

  const handleUpdateMember = async (id: number, data: Partial<Member>): Promise<boolean> => {
    try {
      const updated = await api.updateMember(id, data);
      showToast(`Member details for "${updated.name}" updated!`, 'success');
      loadAllData();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Error updating member details.', 'error');
      return false;
    }
  };

  const handleDeleteMember = async (id: number): Promise<boolean> => {
    try {
      await api.deleteMember(id);
      showToast('Member removed from registry.', 'info');
      loadAllData();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Error deleting member.', 'error');
      return false;
    }
  };

  // Borrow Record Handlers
  const handleIssueBook = async (data: {
    book: number;
    member: number;
    issue_date: string;
    due_date: string;
  }): Promise<boolean> => {
    try {
      const rec = await api.issueBook(data);
      showToast(`Book "${rec.book.title}" successfully issued to ${rec.member.name}!`, 'success');
      loadAllData();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Error issuing book.', 'error');
      return false;
    }
  };

  const handleReturnBook = async (recordId: number): Promise<boolean> => {
    try {
      const updated = await api.returnBook(recordId);
      showToast(`Book "${updated.book.title}" returned! Stock updated.`, 'success');
      loadAllData();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Error marking book as returned.', 'error');
      return false;
    }
  };

  const handleDeleteBorrowRecord = async (recordId: number): Promise<boolean> => {
    try {
      await api.deleteBorrowRecord(recordId);
      showToast('Circulation record removed.', 'info');
      loadAllData();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Error deleting circulation record.', 'error');
      return false;
    }
  };

  const handleIssueBookWithPreselection = (bookId: number) => {
    setPreselectedBookId(bookId);
    setActiveTab('borrows');
  };

  // Dynamic Page Title
  const pageTitle = useMemo(() => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'books': return 'Books Catalog';
      case 'members': return 'Library Members';
      case 'borrows': return 'Circulation & Records';
      case 'architecture': return 'Architecture & API Docs';
      default: return 'Library Management';
    }
  }, [activeTab]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab as any}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Topbar 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
          serverConnected={serverConnected} 
          pageTitle={pageTitle}
        />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {activeTab === 'dashboard' && (
              <DashboardView
                stats={dashboardStats}
                loading={loading}
                onRefresh={loadAllData}
                onNavigate={setActiveTab}
                onQuickIssue={() => setActiveTab('borrows')}
                onQuickReturn={handleReturnBook}
              />
            )}
            
            {activeTab === 'books' && (
              <BookManagement
                books={books}
                loading={loading}
                onRefresh={loadAllData}
                onCreateBook={handleCreateBook}
                onUpdateBook={handleUpdateBook}
                onDeleteBook={handleDeleteBook}
                onIssueBookWithPreselection={handleIssueBookWithPreselection}
              />
            )}
            
            {activeTab === 'members' && (
              <MemberManagement
                members={members}
                loading={loading}
                onRefresh={loadAllData}
                onCreateMember={handleCreateMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
              />
            )}
            
            {activeTab === 'borrows' && (
              <BorrowManagement
                records={borrowRecords}
                books={books}
                members={members}
                loading={loading}
                onRefresh={loadAllData}
                onIssueBook={handleIssueBook}
                onReturnBook={handleReturnBook}
                onDeleteRecord={handleDeleteBorrowRecord}
                preselectedBookId={preselectedBookId}
                onClearPreselectedBook={() => setPreselectedBookId(null)}
              />
            )}

            {activeTab === 'architecture' && <ApiDocsView />}
          </div>
        </main>
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
