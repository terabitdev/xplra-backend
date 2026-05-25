'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Place } from '@/lib/domain/models/place';
import StatusBadge from './StatusBadge';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

interface ContributionCardProps {
  contribution: Place;
  submitterName?: string;
  onAction: (contribution: Place) => void;
}

export default function ContributionCard({ contribution, submitterName, onAction }: ContributionCardProps) {
  const [imgError, setImgError] = useState(false);
  const firstImage = contribution.imageUrls?.[0];
  const isPending = contribution.status === 'pending';
  const actionLabel = isPending ? 'Review' : 'View Details';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="relative w-full h-44 bg-gray-100">
        {firstImage && !imgError ? (
          <Image
            src={firstImage}
            alt={contribution.name}
            fill
            className="object-cover"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col p-4 gap-2">
        <h3 className="font-semibold text-gray-900 truncate" title={contribution.name}>
          {contribution.name || 'Untitled'}
        </h3>

        <p className="text-sm text-gray-500 truncate">
          {contribution.location || '—'}
          {submitterName ? <span className="text-gray-400"> · {submitterName}</span> : null}
        </p>

        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">{formatDate(contribution.createdAt)}</span>
          <StatusBadge status={contribution.status} />
        </div>

        <button
          type="button"
          onClick={() => onAction(contribution)}
          className={`mt-3 w-full py-2 text-sm font-medium rounded-lg border transition-colors ${
            isPending
              ? 'border-indigo-500 text-indigo-600 hover:bg-indigo-50'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
