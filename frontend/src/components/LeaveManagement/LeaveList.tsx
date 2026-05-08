import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CheckCircle, XCircle, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useLeaves, useReviewLeave, useCancelLeave } from '../../hooks/useLeaves';
import { LEAVE_TYPE_LABELS, LEAVE_STATUS_CONFIG } from '../../constants';
import LoadingSpinner from '../Common/LoadingSpinner';
import LeaveForm from './LeaveForm';
import type { LeaveStatus } from '../../types';

const STATUS_TABS: { value: LeaveStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function LeaveList() {
  const [activeTab, setActiveTab] = useState<LeaveStatus | 'all'>('pending');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: leaves = [], isLoading } = useLeaves();
  const reviewLeave = useReviewLeave();
  const cancelLeave = useCancelLeave();

  const filtered = activeTab === 'all' ? leaves : leaves.filter((l) => l.status === activeTab);
  const pendingCount = leaves.filter((l) => l.status === 'pending').length;

  function formatDateRange(start: string, end: string, isHalfDay: boolean, period?: string) {
    const s = format(parseISO(start), 'MMM d, yyyy');
    const e = format(parseISO(end), 'MMM d, yyyy');
    if (isHalfDay) return `${s} (${period})`;
    if (start === end) return s;
    return `${s} – ${e}`;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="md" label="Loading leave requests..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Leave Requests</h2>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus size={15} />
          New Request
        </button>
      </div>

      {/* Leave form modal */}
      {showForm && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowForm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">New Leave Request</h3>
              <LeaveForm onClose={() => setShowForm(false)} />
            </div>
          </div>
        </>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {STATUS_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            {value === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 py-12 text-center">
          <p className="text-sm text-gray-400">No {activeTab === 'all' ? '' : activeTab} leave requests</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((leave) => {
            const statusCfg = LEAVE_STATUS_CONFIG[leave.status];
            const expanded = expandedId === leave.id;

            return (
              <div
                key={leave.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Row */}
                <div className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">{leave.facultyName}</span>
                      <span className="text-xs text-gray-400">{leave.departmentName}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-600">{LEAVE_TYPE_LABELS[leave.leaveType]}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-600">
                        {formatDateRange(leave.startDate, leave.endDate, leave.isHalfDay, leave.halfDayPeriod)}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}
                  >
                    {statusCfg.label}
                  </span>

                  {/* Actions */}
                  {leave.status === 'pending' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => reviewLeave.mutate({ id: leave.id, action: 'approve' })}
                        disabled={reviewLeave.isPending}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                        aria-label="Approve leave"
                        title="Approve"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => reviewLeave.mutate({ id: leave.id, action: 'reject' })}
                        disabled={reviewLeave.isPending}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        aria-label="Reject leave"
                        title="Reject"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  )}

                  {(leave.status === 'pending' || leave.status === 'approved') && (
                    <button
                      onClick={() => cancelLeave.mutate(leave.id)}
                      disabled={cancelLeave.isPending}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      aria-label="Cancel leave"
                      title="Cancel"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}

                  <button
                    onClick={() => setExpandedId(expanded ? null : leave.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors"
                    aria-label={expanded ? 'Collapse details' : 'Expand details'}
                    aria-expanded={expanded}
                  >
                    {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 text-xs text-gray-500 space-y-1">
                    {leave.reason && <p><span className="font-medium text-gray-700">Reason:</span> {leave.reason}</p>}
                    <p>
                      <span className="font-medium text-gray-700">Submitted:</span>{' '}
                      {format(parseISO(leave.submittedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                    {leave.reviewedAt && (
                      <p>
                        <span className="font-medium text-gray-700">Reviewed by {leave.reviewedBy} on:</span>{' '}
                        {format(parseISO(leave.reviewedAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    )}
                    {leave.adminNote && (
                      <p><span className="font-medium text-gray-700">Admin note:</span> {leave.adminNote}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
