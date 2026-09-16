import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  BookMarked
} from 'lucide-react';
import { Book } from '../types';

interface BookManagementProps {
  books: Book[];
  loading: boolean;
  onRefresh: () => void;
  onCreateBook: (data: Omit<Book, 'id'>) => Promise<boolean>;
  onUpdateBook: (id: number, data: Partial<Book>) => Promise<boolean>;
  onDeleteBook: (id: number) => Promise<boolean>;
  onIssueBookWithPreselection: (bookId: number) => void;
}

const CATEGORIES = [
  'All',
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Mechanical',
  'Civil',
  'Mathematics',
  'Physics',
  'Literature',
  'Management',
  'General',
];

export const BookManagement: React.FC<BookManagementProps> = ({
  books,
  loading,
  onCreateBook,
  onUpdateBook,
  onDeleteBook,
  onIssueBookWithPreselection,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Computer Science',
    publisher: '',
    publication_year: new Date().getFullYear(),
    quantity: 5,
    available_quantity: 5,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Filter books locally or via API
  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.isbn.toLowerCase().includes(search.toLowerCase()) ||
      b.publisher.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || b.category === selectedCategory;

    const matchesAvailability = !availableOnly || b.available_quantity > 0;

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      category: 'Computer Science',
      publisher: '',
      publication_year: new Date().getFullYear(),
      quantity: 5,
      available_quantity: 5,
    });
    setFormErrors({});
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      publisher: book.publisher,
      publication_year: book.publication_year,
      quantity: book.quantity,
      available_quantity: book.available_quantity,
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const currentYear = new Date().getFullYear();

    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.author.trim()) errors.author = 'Author is required';
    if (!formData.isbn.trim()) errors.isbn = 'ISBN is required';
    if (!formData.publisher.trim()) errors.publisher = 'Publisher is required';
    
    if (!formData.category || formData.category === 'All') {
      errors.category = 'Category is required';
    }

    if (
      !formData.publication_year ||
      formData.publication_year < 1000 ||
      formData.publication_year > currentYear
    ) {
      errors.publication_year = `Year must be between 1000 and ${currentYear}`;
    }

    if (formData.quantity < 1) {
      errors.quantity = 'Total quantity must be at least 1';
    }

    if (formData.available_quantity < 0) {
      errors.available_quantity = 'Available copies cannot be negative';
    }

    if (formData.available_quantity > formData.quantity) {
      errors.available_quantity = 'Available copies cannot exceed total copies';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const success = await onCreateBook(formData);
    setSubmitting(false);

    if (success) {
      setIsCreateOpen(false);
      resetForm();
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook || !validateForm()) return;

    setSubmitting(true);
    const success = await onUpdateBook(editingBook.id, formData);
    setSubmitting(false);

    if (success) {
      setEditingBook(null);
      resetForm();
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBook) return;
    setSubmitting(true);
    const success = await onDeleteBook(deletingBook.id);
    setSubmitting(false);
    if (success) {
      setDeletingBook(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Book Catalog Management</h2>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage physical copies, classifications, ISBN registration, and stock availability.
          </p>
        </div>

        <button
          id="add-new-book-btn"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Book</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="book-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, author, ISBN..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              id="book-category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2 pl-3 pr-8 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c} {c === 'All' ? '' : 'Dept'}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600 select-none cursor-pointer">
            <input
              id="book-available-only-toggle"
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span>Available only</span>
          </label>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Book Info</th>
                <th className="px-4 py-3">ISBN & Publisher</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3 text-center">Stock (Avail / Total)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBooks.length > 0 ? (
                filteredBooks.map((book) => {
                  const isOutOfStock = book.available_quantity === 0;
                  return (
                    <tr key={book.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{book.title}</div>
                        <div className="text-xs text-slate-500">Author: {book.author}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-xs text-slate-800 font-medium">
                          {book.isbn}
                        </div>
                        <div className="text-xs text-slate-500">{book.publisher}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {book.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {book.publication_year}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              isOutOfStock
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {book.available_quantity} / {book.quantity}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {isOutOfStock ? 'Out of stock' : 'Copies available'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`issue-book-btn-${book.id}`}
                            onClick={() => onIssueBookWithPreselection(book.id)}
                            disabled={isOutOfStock}
                            title={isOutOfStock ? 'No copies available to issue' : 'Issue this book to a member'}
                            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors ${
                              isOutOfStock
                                ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                                : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                            }`}
                          >
                            <BookMarked className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Issue</span>
                          </button>

                          <button
                            id={`edit-book-btn-${book.id}`}
                            onClick={() => openEditModal(book)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit book details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            id={`delete-book-btn-${book.id}`}
                            onClick={() => setDeletingBook(book)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Delete book"
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
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    {loading ? 'Fetching books catalog...' : 'No books found matching your criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Book Modal */}
      {(isCreateOpen || editingBook) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>{editingBook ? 'Edit Book Record' : 'Add New Book to Library'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingBook(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingBook ? handleSaveEdit : handleSaveCreate} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Book Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Design Patterns: Elements of Reusable Object-Oriented Software"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.title ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {formErrors.title && <p className="text-xs text-rose-600 mt-1">{formErrors.title}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Author <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="e.g. Erich Gamma et al."
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.author ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.author && <p className="text-xs text-rose-600 mt-1">{formErrors.author}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ISBN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="e.g. 978-0201633610"
                    className={`w-full px-3 py-2 text-sm border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.isbn ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.isbn && <p className="text-xs text-rose-600 mt-1">{formErrors.isbn}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.category ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && <p className="text-xs text-rose-600 mt-1">{formErrors.category}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Publisher <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    placeholder="e.g. Addison-Wesley"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.publisher ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.publisher && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.publisher}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Publication Year
                  </label>
                  <input
                    type="number"
                    value={formData.publication_year}
                    onChange={(e) =>
                      setFormData({ ...formData, publication_year: parseInt(e.target.value, 10) || 0 })
                    }
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.publication_year ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.publication_year && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.publication_year}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value, 10) || 1;
                      setFormData({
                        ...formData,
                        quantity: qty,
                        // If creating new book, sync available_quantity by default
                        available_quantity: !editingBook ? qty : Math.min(formData.available_quantity, qty),
                      });
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.quantity ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.quantity && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.quantity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Available Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.quantity}
                    value={formData.available_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        available_quantity: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.available_quantity ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.available_quantity && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.available_quantity}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingBook(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="save-book-submit-btn"
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                >
                  {submitting ? 'Saving...' : editingBook ? 'Save Changes' : 'Register Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-50 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to remove <span className="font-semibold text-slate-900">"{deletingBook.title}"</span> from the library catalog? Any active borrow records associated with this book will also be affected.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingBook(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-book-btn"
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
              >
                {submitting ? 'Deleting...' : 'Delete Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
