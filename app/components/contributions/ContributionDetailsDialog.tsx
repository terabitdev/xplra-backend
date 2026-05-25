'use client';

import { useEffect, useMemo, useState } from 'react';
import { Close, Copy } from '@carbon/icons-react';
import { Place } from '@/lib/domain/models/place';
import { Category } from '@/lib/domain/models/category';
import StatusBadge from './StatusBadge';
import ImageCarousel from './ImageCarousel';
import StaticMapPreview from './StaticMapPreview';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

interface Submitter {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface ContributionDetailsDialogProps {
  isOpen: boolean;
  mode: 'review' | 'view';
  contribution: Place | null;
  categories: Category[];
  onClose: () => void;
  onReject?: (contribution: Place) => void;
  onApprove?: (contribution: Place) => void;
  onToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function ContributionDetailsDialog({
  isOpen,
  mode,
  contribution,
  categories,
  onClose,
  onReject,
  onApprove,
  onToast,
}: ContributionDetailsDialogProps) {
  const [submitter, setSubmitter] = useState<Submitter | null>(null);
  const [submitterLoading, setSubmitterLoading] = useState(false);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  useEffect(() => {
    if (!isOpen || !contribution?.userId) {
      setSubmitter(null);
      return;
    }
    let cancelled = false;
    setSubmitterLoading(true);
    fetch(`/api/users/${contribution.userId}`)
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setSubmitter(data);
      })
      .catch(() => {
        if (!cancelled) setSubmitter(null);
      })
      .finally(() => {
        if (!cancelled) setSubmitterLoading(false);
      });
    return () => { cancelled = true; };
  }, [isOpen, contribution?.userId]);

  if (!isOpen || !contribution) return null;

  const handleCopy = async () => {
    const payload = {
      name: contribution.name,
      description: contribution.description || '',
      location: contribution.location || '',
      latitude: contribution.geo?.lat,
      longitude: contribution.geo?.lng,
      imageUrls: contribution.imageUrls || [],
      categorySelections: contribution.categorySelections || [],
      categoryIds: contribution.categoryIds || (contribution.categorySelections || []).flatMap((cs) => cs.path || []),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      onToast?.('Contribution data copied to clipboard', 'success');
    } catch {
      onToast?.('Could not copy to clipboard', 'error');
    }
  };

  const showStatusInfo = mode === 'view';
  const isRejected = contribution.status === 'rejected';
  const showXpInfo = showStatusInfo && !isRejected && typeof contribution.contributionXp === 'number';

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-3" onMouseDown={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === 'review' ? 'Review Contribution' : 'Contribution Details'}
          </h2>
          <div className="flex items-center gap-1.5">
            {mode === 'review' && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Copy size={14} />
                Copy Data
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              aria-label="Close"
            >
              <Close size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Submitter */}
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center overflow-hidden shrink-0">
                {submitter?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={submitter.photoURL} alt={submitter.displayName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <span>{initials(submitter?.displayName)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {submitterLoading ? 'Loading…' : (submitter?.displayName || 'Unknown user')}
                </p>
                <p className="text-xs text-gray-500 truncate">{submitter?.email || '—'}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Submitted {formatDate(contribution.createdAt)}
            </p>
          </div>

          {/* Status info (View Details mode only) */}
          {showStatusInfo && (
            <div className="flex items-center gap-3">
              <StatusBadge status={contribution.status} size="md" />
              {showXpInfo && (
                <span className="text-sm text-gray-600">
                  Contribution XP: <span className="font-semibold text-gray-900">{contribution.contributionXp} XP</span>
                </span>
              )}
            </div>
          )}

          {/* Rejection reason */}
          {showStatusInfo && isRejected && contribution.rejectionReason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <span className="font-medium">Rejection reason:</span> {contribution.rejectionReason}
              </p>
            </div>
          )}

          {/* Images */}
          <ImageCarousel images={contribution.imageUrls || []} alt={contribution.name} />

          {/* Place details */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1.5">{contribution.name || 'Untitled'}</h3>
            {contribution.description && (
              <p className="text-sm text-gray-700 whitespace-pre-line">{contribution.description}</p>
            )}
          </div>

          {(contribution.categorySelections || []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(contribution.categorySelections || []).map((cs) => (
                <span
                  key={cs.selectedId}
                  className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                >
                  {categoryMap.get(cs.selectedId) || cs.selectedId}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{contribution.location || 'No location'}</span>
          </div>

          {/* Map */}
          <StaticMapPreview lat={contribution.geo?.lat} lng={contribution.geo?.lng} />
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          {mode === 'review' ? (
            <>
              <button
                type="button"
                onClick={() => contribution && onReject?.(contribution)}
                className="flex-1 px-3 py-2 text-sm font-medium border border-red-500 text-red-600 rounded-lg hover:bg-red-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => contribution && onApprove?.(contribution)}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                Approve
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
