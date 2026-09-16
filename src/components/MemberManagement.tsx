import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  X,
  BookMarked
} from 'lucide-react';
import { Member } from '../types';

interface MemberManagementProps {
  members: Member[];
  loading: boolean;
  onRefresh: () => void;
  onCreateMember: (data: Omit<Member, 'id'>) => Promise<boolean>;
  onUpdateMember: (id: number, data: Partial<Member>) => Promise<boolean>;
  onDeleteMember: (id: number) => Promise<boolean>;
}

const DEPARTMENTS = [
  'All',
  'Computer Science',
  'Information Technology',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Science & Humanities',
];

export const MemberManagement: React.FC<MemberManagementProps> = ({
  members,
  loading,
  onCreateMember,
  onUpdateMember,
  onDeleteMember,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    member_id: '',
    name: '',
    email: '',
    phone: '',
    department: 'Computer Science',
    registration_date: new Date().toISOString().split('T')[0],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.member_id.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.toLowerCase().includes(search.toLowerCase());

    const matchesDept = selectedDept === 'All' || m.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  const generateMemberId = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `LIB-${year}-${randomNum}`;
  };

  const resetForm = () => {
    setFormData({
      member_id: generateMemberId(),
      name: '',
      email: '',
      phone: '',
      department: 'Computer Science',
      registration_date: new Date().toISOString().split('T')[0],
    });
    setFormErrors({});
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setFormData({
      member_id: member.member_id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      department: member.department,
      registration_date: member.registration_date,
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.member_id.trim()) errors.member_id = 'Member ID is required';
    if (!formData.name.trim()) errors.name = 'Full name is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email format';
    }

    const phoneRegex = /^[\d\+\-\s]+$/;
    if (!formData.phone.trim()) {
      errors.phone = 'Contact phone number is required';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      errors.phone = 'Phone should contain valid numeric characters';
    }
    
    if (!formData.department || formData.department === 'All') {
      errors.department = 'Department is required';
    }

    if (!formData.registration_date) errors.registration_date = 'Registration date is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const success = await onCreateMember(formData);
    setSubmitting(false);

    if (success) {
      setIsCreateOpen(false);
      resetForm();
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !validateForm()) return;

    setSubmitting(true);
    const success = await onUpdateMember(editingMember.id, formData);
    setSubmitting(false);

    if (success) {
      setEditingMember(null);
      resetForm();
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMember) return;
    setSubmitting(true);
    const success = await onDeleteMember(deletingMember.id);
    setSubmitting(false);
    if (success) {
      setDeletingMember(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Library Member Management</h2>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Register students and faculty, update contact details, and track active borrowing cards.
          </p>
        </div>

        <button
          id="register-member-btn"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Member</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="member-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, email, phone..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            id="member-department-filter"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full md:w-auto py-2 pl-3 pr-8 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Member ID</th>
                <th className="px-4 py-3">Name & Email</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Registered On</th>
                <th className="px-4 py-3 text-center">Active Loans</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  const hasActiveLoans = (member.active_borrows_count || 0) > 0;
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-indigo-700">
                        {member.member_id}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{member.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{member.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {member.department}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{member.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{member.registration_date}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {hasActiveLoans ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <BookMarked className="w-3 h-3 text-amber-600" />
                            {member.active_borrows_count} {member.active_borrows_count === 1 ? 'book' : 'books'}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`edit-member-btn-${member.id}`}
                            onClick={() => openEditModal(member)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit member details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            id={`delete-member-btn-${member.id}`}
                            onClick={() => setDeletingMember(member)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title={hasActiveLoans ? 'Cannot delete member with active loans' : 'Delete member'}
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
                    {loading ? 'Fetching registered members...' : 'No members found matching your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Member Modal */}
      {(isCreateOpen || editingMember) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>{editingMember ? 'Edit Member Details' : 'Register New Member'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingMember(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingMember ? handleSaveEdit : handleSaveCreate} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Member ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.member_id}
                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                    placeholder="e.g. LIB-2026-001"
                    className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.member_id ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.member_id && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.member_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.department ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select a department</option>
                    {DEPARTMENTS.filter((d) => d !== 'All').map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {formErrors.department && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.department}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {formErrors.name && <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@college.edu"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.email && <p className="text-xs text-rose-600 mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 0192"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.phone && <p className="text-xs text-rose-600 mt-1">{formErrors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registration Date
                </label>
                <input
                  type="date"
                  value={formData.registration_date}
                  onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.registration_date ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {formErrors.registration_date && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.registration_date}</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingMember(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="save-member-submit-btn"
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                >
                  {submitting ? 'Saving...' : editingMember ? 'Save Changes' : 'Register Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-50 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Confirm Member Deletion</h3>
            </div>
            
            {(deletingMember.active_borrows_count || 0) > 0 ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                  <strong>Deletion Blocked:</strong> {deletingMember.name} currently has{' '}
                  <span className="font-bold">{deletingMember.active_borrows_count}</span> unreturned book(s). The member cannot be deleted until all borrowed books are marked as returned.
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setDeletingMember(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Understood
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-600 mb-4">
                  Are you sure you want to delete member{' '}
                  <span className="font-semibold text-slate-900">{deletingMember.name}</span> ({deletingMember.member_id})?
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setDeletingMember(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-delete-member-btn"
                    onClick={handleConfirmDelete}
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
                  >
                    {submitting ? 'Deleting...' : 'Delete Member'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
