'use client';

import { useCallback, useEffect, useState } from 'react';
import { Close, Warning, PauseOutline, MisuseOutline, CloseOutline } from '@carbon/icons-react';
import { useAppSelector } from '@/app/store/hooks';
import Toaster from '@/app/components/ui/Toaster';

interface PlayerReportUserInfo {
  uid: string;
  name: string;
  email: string;
  username: string;
  accountStatus: string;
}

interface PlayerReport {
  id: string;
  reporterUid: string;
  reporter: PlayerReportUserInfo | null;
  reportedUid: string;
  reported: PlayerReportUserInfo | null;
  reason: string;
  details: string | null;
  sourceScreen: string;
  status: string;
  resolution: string;
  resolutionNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
}

interface ReportHistoryEntry {
  id: string;
  reason: string;
  status: string;
  resolution: string;
  createdAt: string;
}

interface ModerationAction {
  id: string;
  uid: string;
  action: string;
  reason: string;
  reportId: string;
  adminUid: string;
  createdAt: string;
}

interface PlayerReportDetail {
  report: PlayerReport;
  reportHistory: { last90DaysCount: number; entries: ReportHistoryEntry[] };
  moderationHistory: ModerationAction[];
}

type Decision = 'DISMISS' | 'WARN' | 'SUSPEND' | 'BAN';

interface PlayerReport_DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string | null;
  /** Called after a report is resolved, so the list behind the modal can refresh. */
  onResolved?: () => void;
}

const DECISIONS: { key: Decision; label: string; icon: typeof Warning; tone: string }[] = [
  { key: 'DISMISS', label: 'Dismiss — No Action', icon: CloseOutline, tone: 'gray' },
  { key: 'WARN', label: 'Warn Player', icon: Warning, tone: 'amber' },
  { key: 'SUSPEND', label: 'Suspend Player', icon: PauseOutline, tone: 'orange' },
  { key: 'BAN', label: 'Ban Player', icon: MisuseOutline, tone: 'red' },
];

const TONE_CLASSES: Record<string, string> = {
  gray: 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50',
  amber: 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100',
  orange: 'text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100',
  red: 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100',
};

const CONFIRM_TONE_CLASSES: Record<string, string> = {
  gray: 'bg-gray-700 hover:bg-gray-800',
  amber: 'bg-amber-600 hover:bg-amber-700',
  orange: 'bg-orange-600 hover:bg-orange-700',
  red: 'bg-red-600 hover:bg-red-700',
};

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
  if (status === 'OPEN') return 'bg-amber-100 text-amber-700';
  if (status === 'RESOLVED') return 'bg-green-100 text-green-700';
  if (status === 'DISMISSED') return 'bg-gray-100 text-gray-500';
  return 'bg-blue-100 text-blue-700';
}

function getAccountStatusStyle(status: string) {
  if (status === 'SUSPENDED') return 'bg-orange-100 text-orange-700';
  if (status === 'BANNED') return 'bg-red-100 text-red-600';
  return 'bg-green-100 text-green-700';
}

function getModerationActionStyle(action: string) {
  if (action === 'WARNING') return 'bg-amber-100 text-amber-700';
  if (action === 'SUSPENSION') return 'bg-orange-100 text-orange-700';
  if (action === 'BAN') return 'bg-red-100 text-red-600';
  return 'bg-gray-100 text-gray-600';
}

function resolutionLabel(resolution: string) {
  return resolution
    .split('_')
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(' ');
}

function UserCard({ label, user, uid }: { label: string; user: PlayerReportUserInfo | null; uid: string }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      {user ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name || '—'}</p>
            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${getAccountStatusStyle(user.accountStatus)}`}>
              {user.accountStatus}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{user.username ? `@${user.username}` : '—'}</p>
          <p className="text-xs text-gray-400 truncate">{user.email || '—'}</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 truncate">{uid || '—'}</p>
          <p className="text-xs text-gray-400 mt-1">Profile not found.</p>
        </div>
      )}
    </div>
  );
}

export default function PlayerReport_DetailModal({ isOpen, onClose, reportId, onResolved }: PlayerReport_DetailModalProps) {
  const adminUid = useAppSelector((state) => state.user.uid);

  const [detail, setDetail] = useState<PlayerReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeDecision, setActiveDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', isVisible: false });

  const showToast = (message: string, type: 'success' | 'error' = 'success') =>
    setToast({ message, type, isVisible: true });

  const loadDetail = useCallback(async () => {
    if (!reportId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/player-reports/${reportId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load report');
      setDetail(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    if (isOpen && reportId) {
      setActiveDecision(null);
      setNote('');
      loadDetail();
    }
  }, [isOpen, reportId, loadDetail]);

  if (!isOpen) return null;

  const requiresNote = activeDecision !== 'DISMISS';

  const handleConfirmDecision = async () => {
    if (!activeDecision || !detail) return;
    if (!adminUid) {
      showToast('You must be signed in as an admin to do this.', 'error');
      return;
    }
    if (requiresNote && !note.trim()) {
      showToast('A reason is required for this action.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/player-reports/${detail.report.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUid, decision: activeDecision, note: note.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to resolve report');

      showToast('Report resolved.');
      setActiveDecision(null);
      setNote('');
      await loadDetail();
      onResolved?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to resolve report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const report = detail?.report;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-0 sm:p-3">
      <div className="bg-white rounded-none sm:rounded-xl shadow-xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Report Detail</h2>
            {report && <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {report.id}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <Close size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-5 space-y-3 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="h-16 bg-gray-100 rounded" />
              <div className="h-24 bg-gray-100 rounded" />
            </div>
          )}

          {!loading && error && (
            <div className="p-5 text-sm text-red-600">{error}</div>
          )}

          {!loading && report && (
            <>
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
                      {report.status}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <Label>Submitted</Label>
                    <Value>{formatDateTime(report.createdAt)}</Value>
                  </div>
                </div>

                {report.sourceScreen && (
                  <div>
                    <Label>Source Screen</Label>
                    <Value>{report.sourceScreen}</Value>
                  </div>
                )}

                <div>
                  <Label>Details from Reporter</Label>
                  <p className="text-sm text-gray-700 leading-relaxed mt-0.5">
                    {report.details || <span className="text-gray-400">No additional details provided.</span>}
                  </p>
                </div>
              </div>

              {/* Reporter / Reported */}
              <div className="border-t border-gray-100 px-5 py-4 flex gap-6">
                <UserCard label="Reporting Player" user={report.reporter} uid={report.reporterUid} />
                <UserCard label="Reported Player" user={report.reported} uid={report.reportedUid} />
              </div>

              {/* Report history */}
              <div className="border-t border-gray-100 px-5 py-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Report History — {detail!.reportHistory.last90DaysCount} report
                  {detail!.reportHistory.last90DaysCount === 1 ? '' : 's'} on this player in the last 90 days
                </p>
                {detail!.reportHistory.entries.length === 0 ? (
                  <p className="text-sm text-gray-400">No other reports against this player.</p>
                ) : (
                  <div className="space-y-1.5">
                    {detail!.reportHistory.entries.map((e) => (
                      <div key={e.id} className="flex items-center justify-between gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-gray-700 truncate">{e.reason}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusStyle(e.status)}`}>
                            {e.status}
                            {e.resolution ? ` · ${resolutionLabel(e.resolution)}` : ''}
                          </span>
                          <span className="text-xs text-gray-400">{formatDateTime(e.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Moderation history */}
              <div className="border-t border-gray-100 px-5 py-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Previous Moderation Actions
                </p>
                {detail!.moderationHistory.length === 0 ? (
                  <p className="text-sm text-gray-400">No previous warnings, suspensions, or bans.</p>
                ) : (
                  <div className="space-y-1.5">
                    {detail!.moderationHistory.map((a) => (
                      <div key={a.id} className="bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getModerationActionStyle(a.action)}`}>
                            {a.action}
                          </span>
                          <span className="text-xs text-gray-400">{formatDateTime(a.createdAt)}</span>
                        </div>
                        {a.reason && <p className="text-sm text-gray-700 mt-1">{a.reason}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resolution */}
              <div className="border-t border-gray-100 px-5 py-4">
                {report.status !== 'OPEN' ? (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Resolution</p>
                    <div className="bg-gray-50 rounded-lg px-3 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(report.status)}`}>
                          {report.status} · {resolutionLabel(report.resolution)}
                        </span>
                        <span className="text-xs text-gray-400">{formatDateTime(report.reviewedAt)}</span>
                      </div>
                      {report.resolutionNote && <p className="text-sm text-gray-700">{report.resolutionNote}</p>}
                      <p className="text-xs text-gray-400">Reviewed by {report.reviewedBy || '—'}</p>
                    </div>
                  </div>
                ) : activeDecision ? (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      {DECISIONS.find((d) => d.key === activeDecision)?.label}
                    </p>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={requiresNote ? 'Reason for this action (required)…' : 'Optional note…'}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDecision(null);
                          setNote('');
                        }}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmDecision}
                        disabled={isSubmitting}
                        className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${CONFIRM_TONE_CLASSES[DECISIONS.find((d) => d.key === activeDecision)?.tone || 'gray']}`}
                      >
                        {isSubmitting ? 'Submitting…' : 'Confirm'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Resolve This Report</p>
                    <div className="grid grid-cols-2 gap-2">
                      {DECISIONS.map(({ key, label, icon: Icon, tone }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setActiveDecision(key)}
                          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${TONE_CLASSES[tone]}`}
                        >
                          <Icon size={16} />
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Or leave this report open — nothing happens until an action is confirmed.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
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

      <Toaster
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((t) => ({ ...t, isVisible: false }))}
      />
    </div>
  );
}
