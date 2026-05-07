'use client';

import { Close } from '@carbon/icons-react';
import { QuestReport } from '@/app/store/slices/questReportsSlice';

interface QuestReport_DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: QuestReport | null;
}

const TYPE_LABELS: Record<string, string> = {
  checkin: 'Check-In',
  dwell: 'Dwell',
  accrual: 'Accrual',
  qrCode: 'QR Code',
  codePhrase: 'Code Phrase',
};

function formatDateTime(iso: string) {
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
  if (lower.includes('location')) return 'bg-amber-100 text-amber-700';
  if (lower.includes('offensive') || lower.includes('inappropriate')) return 'bg-red-100 text-red-600';
  if (lower.includes('duplicate')) return 'bg-blue-100 text-blue-700';
  if (lower.includes('broken') || lower.includes('completed')) return 'bg-orange-100 text-orange-700';
  return 'bg-gray-100 text-gray-600';
}

export default function QuestReport_DetailModal({ isOpen, onClose, report }: QuestReport_DetailModalProps) {
  if (!isOpen || !report) return null;

  const quest = report.quest;
  const questTitle = (quest.title as string) || '—';
  const questDescription = (quest.description as string) || null;
  const questType = (quest.type as string) || null;
  const questXp = quest.xp !== undefined ? Number(quest.xp) : null;
  const questIsActive = quest.isActive as boolean | undefined;
  const questLocation = (quest.location as string) || null;

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
              <div className="text-right shrink-0">
                <Label>Reported At</Label>
                <Value>{formatDateTime(report.reportedAt)}</Value>
              </div>
            </div>

            {report.details && (
              <div>
                <Label>Details</Label>
                <p className="text-sm text-gray-700 leading-relaxed mt-0.5">{report.details}</p>
              </div>
            )}
          </div>

          {/* Reporter section */}
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reporter</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <Label>Display Name</Label>
                <Value>{report.reporter.displayName || '—'}</Value>
              </div>
              <div>
                <Label>Email</Label>
                <Value>{report.reporter.email}</Value>
              </div>
            </div>
          </div>

          {/* Quest Snapshot section */}
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quest Snapshot</p>

            <div>
              <Label>Title</Label>
              <Value>{questTitle}</Value>
            </div>

            {questDescription && (
              <div>
                <Label>Description</Label>
                <p className="text-sm text-gray-700 leading-relaxed mt-0.5">{questDescription}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
              {questType && (
                <div>
                  <Label>Type</Label>
                  <Value>{TYPE_LABELS[questType] ?? questType}</Value>
                </div>
              )}
              {questXp !== null && (
                <div>
                  <Label>XP</Label>
                  <p className="text-sm font-semibold text-amber-500">{questXp}</p>
                </div>
              )}
              {questIsActive !== undefined && (
                <div>
                  <Label>Status</Label>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${questIsActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {questIsActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              )}
            </div>

            {questLocation && (
              <div>
                <Label>Location</Label>
                <Value>{questLocation}</Value>
              </div>
            )}

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
