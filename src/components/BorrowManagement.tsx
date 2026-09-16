import React, { useState, useEffect } from 'react';
import {
  BookMarked,
  Search,
  Plus,
  RotateCcw,
  Trash2,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  BookOpen,
  X,
  Clock
} from 'lucide-react';
import { BorrowRecord, Book, Member, BorrowStatus } from '../types';

interface BorrowManagementProps {
  records: BorrowRecord[];
  books: Book[];
  members: Member[];
  loading: boolean;
  onRefresh: () => void;
  onIssueBook: (data: { book: number; member: number; issue_date: string; due_date: string }) => Promise<boolean>;
  onReturnBook: (recordId: number) => Promise<boolean>;
  onDeleteRecord: (recordId: number) => Promise<boolean>;
  preselectedBookId?: number | null;
  onClearPreselectedBook?: () => void;
}

export const BorrowManagement: React.FC<BorrowManagementProps> = ({
  records,
  books,
  members,
  loading,
  onIssueBook,
  onReturnBook,
  onDeleteRecord,
  preselectedBookId,
  onClearPreselectedBook,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | BorrowStatus>('All');

  // Modal States
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<BorrowRecord | null>(null);

  // Form State for Issuing Book
  const [selectedBookId, setSelectedBookId] = useState<number | ''>('');
  const [selectedMemberId, setSelectedMemberId] = useState<number | ''>('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);

  // Default due date to +14 days
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };

  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // If a preselected book ID was passed in, open modal with that book preselected
  useEffect(() => {
    if (preselectedBookId) {
      setSelectedBookId(preselectedBookId);
      setIsIssueModalOpen(true);
      if (onClearPreselectedBook) onClearPreselectedBook();
    }
  }, [preselectedBookId, onClearPreselectedBook]);

  // Filter records
  const filteredRecords = records.filter((rec) => {
    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;
    const matchesSearch =
      rec.book.title.toLowerCase().includes(search.toLowerCase()) ||
      rec.book.isbn.toLowerCase().includes(search.toLowerCase()) ||
      rec.member.name.toLowerCase().includes(search.toLowerCase()) ||
      rec.member.member_id.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const openIssueModal = () => {
    // Pick first available book and first member if available
    const availableBooks = books.filter((b) => b.available_quantity > 0);
    setSelectedBookId(availableBooks[0]?.id || '');
    setSelectedMemberId(members[0]?.id || '');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate(defaultDueDate());
    setFormErrors({});
    setIsIssueModalOpen(true);
  };

  const validateIssueForm = () => {
    const errors: Record<string, string> = {};

    if (!selectedBookId) {
      errors.book = 'Please select a book to issue';
    } else {
      const b = books.find((x) => x.id === selectedBookId);
      if (b && b.available_quantity <= 0) {
        errors.book = 'No copies of this book are currently available';
      }
    }

    if (!selectedMemberId) {
      errors.member = 'Please select a member';
    }

    if (!issueDate) errors.issue_date = 'Issue date is required';
    if (!dueDate) errors.due_date = 'Due date is required';

    if (issueDate && dueDate && dueDate < issueDate) {
      errors.due_date = 'Due date cannot be earlier than issue date';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateIssueForm()) return;

    setSubmitting(true);
    const success = await onIssueBook({
      book: Number(selectedBookId),
      member: Number(selectedMemberId),
      issue_date: issueDate,
      due_date: dueDate,
    });
    setSubmitting(false);

    if (success) {
      setIsIssueModalOpen(false);
    }
  };

  const handleReturnClick = async (recordId: number) => {
    setSubmitting(true);
    await onReturnBook(recordId);
    setSubmitting(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;
    setSubmitting(true);
    const success = await onDeleteRecord(deletingRecord.id);
    setSubmitting(false);
    if (success) {
      setDeletingRecord(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Borrow & Return Management</h2>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Issue books to students/faculty, log return dates, track overdue loans, and maintain real-time stock balances.
          </p>
        </div>

        <button
          id="issue-new-book-btn"
          onClick={openIssueModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Book to Member</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="borrow-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by book, ISBN, or member..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['All', 'Issued', 'Overdue', 'Returned'] as const).map((status) => {
            const isSelected = statusFilter === status;
            return (
              <button
                key={status}
                id={`filter-status-${status.toLowerCase()}`}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isSelected
                    ? status === 'Overdue'
                      ? 'bg-rose-600 text-white'
                      : status === 'Returned'
                      ? 'bg-emerald-600 text-white'
                      : status === 'Issued'
                      ? 'bg-blue-600 text-white'
                      : 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Book Details</th>
                <th className="px-4 py-3">Borrower (Member)</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Return Date</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => {
                  const isOverdue = record.status === 'Overdue';
                  const isIssued = record.status === 'Issued';
                  const isReturned = record.status === 'Returned';

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{record.book.title}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          ISBN: {record.book.isbn}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">{record.member.name}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          {record.member.member_id}
                          {record.member.department && ` • ${record.member.department}`}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {record.issue_date}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-medium">
                        <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                          {record.due_date}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {record.return_date ? (
                          <span className="text-emerald-700 font-medium">{record.return_date}</span>
                        ) : (
                          <span className="text-slate-400 italic">Not returned yet</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {isIssued && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Issued
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Overdue
                          </span>
                        )}
                        {isReturned && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Returned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(isIssued || isOverdue) && (
                            <button
                              id={`mark-returned-btn-${record.id}`}
                              onClick={() => handleReturnClick(record.id)}
                              disabled={submitting}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 transition-colors"
                              title="Mark book as returned"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Return</span>
                            </button>
                          )}

                          <button
                            id={`delete-record-btn-${record.id}`}
                            onClick={() => setDeletingRecord(record)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Delete transaction record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    {loading ? 'Fetching circulation records...' : 'No borrow records found matching your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Book Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-indigo-600" />
                <span>Issue Book to Member</span>
              </h3>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4 pt-4">
              {/* Book Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Select Book <span className="text-rose-500">*</span></span>
                  <span className="text-slate-400 font-normal">Shows in-stock books</span>
                </label>
                <select
                  id="issue-select-book"
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(Number(e.target.value))}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.book ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                >
                  <option value="">-- Choose a book from catalog --</option>
                  {books.map((b) => (
                    <option
                      key={b.id}
                      value={b.id}
                      disabled={b.available_quantity <= 0}
                    >
                      {b.title} (Avail: {b.available_quantity}/{b.quantity})
                      {b.available_quantity <= 0 ? ' - [OUT OF STOCK]' : ''}
                    </option>
                  ))}
                </select>
                {formErrors.book && <p className="text-xs text-rose-600 mt-1">{formErrors.book}</p>}
              </div>

              {/* Member Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Borrower (Member) <span className="text-rose-500">*</span>
                </label>
                <select
                  id="issue-select-member"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(Number(e.target.value))}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.member ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                >
                  <option value="">-- Choose registered member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.member_id}) - {m.department}
                    </option>
                  ))}
                </select>
                {formErrors.member && <p className="text-xs text-rose-600 mt-1">{formErrors.member}</p>}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Issue Date
                  </label>
                  <input
                    id="issue-date-input"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formErrors.issue_date && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.issue_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Date <span className="text-slate-400 font-normal">(Default +14 days)</span>
                  </label>
                  <input
                    id="due-date-input"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formErrors.due_date && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.due_date}</p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                <strong>Borrowing Policy:</strong> Standard loan period is 14 days. Issuing this book will automatically decrement its available copies by 1 in the SQLite database.
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="confirm-issue-book-btn"
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                >
                  {submitting ? 'Processing...' : 'Confirm Loan Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Record Confirmation Modal */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Borrow Record</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete this borrowing transaction for{' '}
              <span className="font-semibold text-slate-900">"{deletingRecord.book.title}"</span> issued to{' '}
              <span className="font-semibold text-slate-900">{deletingRecord.member.name}</span>? If the book has not been returned, its available copy will be restored.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingRecord(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-record-btn"
                onClick={handleConfirmConfirm => handleConfirmDelete()}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
              >
                {submitting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
