'use client';

import { Close } from '@carbon/icons-react';
import { UserReport } from '@/app/store/slices/userReportsSlice';

interface UserReport_DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: UserReport | null;
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 mb-0.5">{children}</p>;
}

function Value({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-900">{children}</p>;
}

function getReasonStyle(reason: string) {
  const lower = reason.toLowerCase();
  if (lower.includes('harass') || lower.includes('bully')) return 'bg-red-100 text-red-600';
  if (lower.includes('safety')) return 'bg-amber-100 text-amber-700';
  if (lower.includes('spam')) return 'bg-blue-100 text-blue-700';
  if (lower.includes('fake') || lower.includes('impersonat')) return 'bg-purple-100 text-purple-700';
  if (lower.includes('inappropriate') || lower.includes('offensive')) return 'bg-orange-100 text-orange-700';
  return 'bg-gray-100 text-gray-600';
}

function getStatusStyle(status: string) {
  const upper = status.toUpperCase();
  if (upper === 'OPEN') return 'bg-amber-100 text-amber-700';
  if (upper === 'RESOLVED' || upper === 'CLOSED') return 'bg-green-100 text-green-700';
  if (upper === 'DISMISSED') return 'bg-gray-100 text-gray-500';
  return 'bg-blue-100 text-blue-700';
}

function UserBlock({ label, user, uid }: { label: string; user: UserReport['reporter']; uid: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      {user ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <Label>Name</Label>
            <Value>{user.name || '—'}</Value>
          </div>
          <div>
            <Label>Username</Label>
            <Value>{user.username ? `@${user.username}` : '—'}</Value>
          </div>
          <div className="col-span-2">
            <Label>Email</Label>
            <Value>{user.email || '—'}</Value>
          </div>
        </div>
      ) : (
        <div>
          <Label>UID</Label>
          <Value>{uid || '—'}</Value>
          <p className="text-xs text-gray-400 mt-1">User profile not found — may have been deleted.</p>
        </div>
      )}
    </div>
  );
}

export default function UserReport_DetailModal({ isOpen, onClose, report }: UserReport_DetailModalProps) {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-0 sm:p-3">
      <div className="bg-white rounded-none sm:rounded-xl shadow-xl w-full max-w-lg h-full sm:h-auto sm:max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Report Detail</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <Close size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Report section */}
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label>Reason</Label>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${getReasonStyle(report.reason)}`}>
                  {report.reason}
                </span>
              </div>
              <div>
                <Label>Status</Label>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(report.status)}`}>
                  {report.status || '—'}
                </span>
              </div>
              <div className="text-right shrink-0">
                <Label>Reported At</Label>
                <Value>{formatDateTime(report.createdAt)}</Value>
              </div>
            </div>

            {report.sourceScreen && (
              <div>
                <Label>Source Screen</Label>
                <Value>{report.sourceScreen}</Value>
              </div>
            )}

            {report.details && (
              <div>
                <Label>Details</Label>
                <p className="text-sm text-gray-700 leading-relaxed mt-0.5">{report.details}</p>
              </div>
            )}

            {(report.reviewedAt || report.reviewedBy) && (
              <div className="grid grid-cols-2 gap-x-4">
                <div>
                  <Label>Reviewed At</Label>
                  <Value>{formatDateTime(report.reviewedAt)}</Value>
                </div>
                <div>
                  <Label>Reviewed By</Label>
                  <Value>{report.reviewedBy || '—'}</Value>
                </div>
              </div>
            )}
          </div>

          {/* Reporter section */}
          <div className="border-t border-gray-100 px-5 py-4">
            <UserBlock label="Reported By" user={report.reporter} uid={report.reporterUid} />
          </div>

          {/* Reported user section */}
          <div className="border-t border-gray-100 px-5 py-4">
            <UserBlock label="Reported User" user={report.reported} uid={report.reportedUid} />
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 rounded-none sm:rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
