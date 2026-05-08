import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Send, X } from 'lucide-react';
import { useSubmitLeave } from '../../hooks/useLeaves';
import { useDepartments } from '../../hooks/useFaculty';
import { LEAVE_TYPE_LABELS } from '../../constants';
import { MOCK_FACULTY } from '../../services/mockData';
import type { LeaveFormData, LeaveType } from '../../types';

interface Props {
  onClose: () => void;
  preselectedFacultyId?: string;
}

export default function LeaveForm({ onClose, preselectedFacultyId }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const submitLeave = useSubmitLeave();

  const [facultyId, setFacultyId] = useState(preselectedFacultyId ?? '');
  const [leaveType, setLeaveType] = useState<LeaveType>('casual');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<'morning' | 'afternoon'>('morning');
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: LeaveFormData = {
      facultyId,
      leaveType,
      startDate,
      endDate: isHalfDay ? startDate : endDate,
      isHalfDay,
      halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
      reason: reason.trim() || undefined,
    };
    await submitLeave.mutateAsync(payload);
    setSuccess(true);
    setTimeout(onClose, 2000);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <Send size={24} className="text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Leave Request Submitted</h3>
        <p className="text-sm text-gray-500">Pending admin approval. Closing…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Faculty select */}
      {!preselectedFacultyId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="leave-faculty">
            Faculty Member <span className="text-red-500">*</span>
          </label>
          <select
            id="leave-faculty"
            value={facultyId}
            onChange={(e) => setFacultyId(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
          >
            <option value="">Select faculty...</option>
            {MOCK_FACULTY.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.department.code})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Leave type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="leave-type">
          Leave Type <span className="text-red-500">*</span>
        </label>
        <select
          id="leave-type"
          value={leaveType}
          onChange={(e) => setLeaveType(e.target.value as LeaveType)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
        >
          {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Half day toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="half-day"
          checked={isHalfDay}
          onChange={(e) => setIsHalfDay(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <label htmlFor="half-day" className="text-sm text-gray-700">Half day leave</label>
        {isHalfDay && (
          <select
            value={halfDayPeriod}
            onChange={(e) => setHalfDayPeriod(e.target.value as 'morning' | 'afternoon')}
            className="ml-2 px-2 py-1 text-xs rounded-lg border border-gray-300 focus:border-blue-500 outline-none bg-white"
          >
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
          </select>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="leave-start">
            {isHalfDay ? 'Date' : 'From'} <span className="text-red-500">*</span>
          </label>
          <input
            id="leave-start"
            type="date"
            value={startDate}
            min={today}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
          />
        </div>
        {!isHalfDay && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="leave-end">
              To <span className="text-red-500">*</span>
            </label>
            <input
              id="leave-end"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
        )}
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="leave-reason">
          Reason <span className="text-xs font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="leave-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Brief reason for leave..."
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitLeave.isPending || !facultyId}
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {submitLeave.isPending ? 'Submitting…' : 'Submit Leave Request'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>

      {submitLeave.isError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          Failed to submit leave request. Please try again.
        </p>
      )}
    </form>
  );
}
