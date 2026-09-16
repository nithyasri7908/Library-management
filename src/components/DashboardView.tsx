import React from 'react';
import {
  BookOpen,
  Users,
  BookMarked,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  Library
} from 'lucide-react';
import { DashboardStats, ActiveTab } from '../types';

interface DashboardViewProps {
  stats: DashboardStats | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (tab: ActiveTab) => void;
  onQuickIssue: () => void;
  onQuickReturn: (id: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  loading,
  onRefresh,
  onNavigate,
  onQuickIssue,
  onQuickReturn,
}) => {
  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading library statistics...</p>
      </div>
    );
  }

  const s = stats || {
    total_books: 0,
    total_copies: 0,
    available_copies: 0,
    borrowed_copies: 0,
    total_members: 0,
    active_borrows: 0,
    overdue_borrows: 0,
    returned_borrows: 0,
    categories: [],
    recent_borrows: [],
  };

  const statCards = [
    {
      id: 'stat-total-books',
      title: 'Total Titles',
      value: s.total_books,
      subtitle: `${s.total_copies} total copies in stock`,
      icon: BookOpen,
      iconBg: 'bg-indigo-50 text-indigo-600',
      borderAccent: 'border-slate-200',
      targetTab: 'books' as ActiveTab,
    },
    {
      id: 'stat-available-copies',
      title: 'Available Copies',
      value: s.available_copies,
      subtitle: `${s.borrowed_copies} copies currently on loan`,
      icon: CheckCircle,
      iconBg: 'bg-emerald-50 text-emerald-600',
      borderAccent: 'border-slate-200',
      targetTab: 'books' as ActiveTab,
    },
    {
      id: 'stat-active-loans',
      title: 'Active Borrows',
      value: s.active_borrows,
      subtitle: `${s.returned_borrows} returned history`,
      icon: BookMarked,
      iconBg: 'bg-blue-50 text-blue-600',
      borderAccent: 'border-slate-200',
      targetTab: 'borrows' as ActiveTab,
    },
    {
      id: 'stat-overdue-loans',
      title: 'Overdue Books',
      value: s.overdue_borrows,
      subtitle: s.overdue_borrows > 0 ? 'Requires immediate return' : 'No overdue loans',
      icon: AlertTriangle,
      iconBg: s.overdue_borrows > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600',
      borderAccent: s.overdue_borrows > 0 ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200',
      targetTab: 'borrows' as ActiveTab,
      highlight: s.overdue_borrows > 0,
    },
    {
      id: 'stat-total-members',
      title: 'Total Members',
      value: s.total_members,
      subtitle: 'Students & Faculty registered',
      icon: Users,
      iconBg: 'bg-purple-50 text-purple-600',
      borderAccent: 'border-slate-200',
      targetTab: 'members' as ActiveTab,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Library Operations Dashboard</h2>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time catalog analytics, member loans, and circulation metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="dashboard-refresh-btn"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            id="dashboard-issue-book-btn"
            onClick={onQuickIssue}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Issue Book</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              id={card.id}
              onClick={() => onNavigate(card.targetTab)}
              className={`p-5 rounded-xl bg-white border ${card.borderAccent} shadow-xs hover:shadow-md transition-all cursor-pointer group`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-slate-900">{card.value}</div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium truncate">
                {card.subtitle}
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Books by Department</h3>
              </div>
              <button
                onClick={() => onNavigate('books')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View Catalog
              </button>
            </div>

            <div className="space-y-3.5">
              {s.categories.length > 0 ? (
                s.categories.map((cat) => {
                  const percent = s.total_books > 0 ? Math.round((cat.count / s.total_books) * 100) : 0;
                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{cat.category}</span>
                        <span className="text-slate-500 font-semibold">{cat.count} titles ({cat.total_copies || cat.count} copies)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No categories recorded yet.</p>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Utilization Rate</span>
            <span className="font-bold text-slate-900">
              {s.total_copies > 0 ? Math.round((s.borrowed_copies / s.total_copies) * 100) : 0}% copies borrowed
            </span>
          </div>
        </div>

        {/* Recent Circulation Transactions */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-indigo-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Recent Borrowing Activity</h3>
            </div>
            <button
              onClick={() => onNavigate('borrows')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <span>All Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2.5 rounded-l-lg">Book Title</th>
                  <th className="px-3 py-2.5">Member</th>
                  <th className="px-3 py-2.5">Due Date</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right rounded-r-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {s.recent_borrows && s.recent_borrows.length > 0 ? (
                  s.recent_borrows.map((record) => {
                    const isOverdue = record.status === 'Overdue';
                    const isIssued = record.status === 'Issued';
                    const isReturned = record.status === 'Returned';

                    return (
                      <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-3 font-medium text-slate-900">
                          <div className="truncate max-w-[200px]" title={record.book.title}>
                            {record.book.title}
                          </div>
                          <div className="text-xs text-slate-400 font-normal">
                            ISBN: {record.book.isbn}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          <div className="font-medium text-slate-800">{record.member.name}</div>
                          <div className="text-xs text-slate-400">{record.member.member_id}</div>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-600 font-medium">
                          {record.due_date}
                        </td>
                        <td className="px-3 py-3">
                          {isIssued && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              Issued
                            </span>
                          )}
                          {isOverdue && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              Overdue
                            </span>
                          )}
                          {isReturned && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Returned
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {(isIssued || isOverdue) ? (
                            <button
                              id={`quick-return-btn-${record.id}`}
                              onClick={() => onQuickReturn(record.id)}
                              className="text-xs px-2.5 py-1 rounded font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition-colors border border-slate-200 hover:border-emerald-300"
                            >
                              Return Book
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-normal">
                              Returned {record.return_date || ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      No loan records found. Click 'Issue Book' to create your first borrow transaction.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
