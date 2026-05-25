import { PlaceStatus } from '@/lib/domain/models/place';

const STYLES: Record<PlaceStatus, { className: string; label: string }> = {
  pending: { className: 'bg-amber-100 text-amber-700 border border-amber-200', label: 'Pending' },
  approved: { className: 'bg-emerald-100 text-emerald-700 border border-emerald-200', label: 'Approved' },
  active: { className: 'bg-green-100 text-green-700 border border-green-200', label: 'Active' },
  hidden: { className: 'bg-gray-100 text-gray-600 border border-gray-200', label: 'Hidden' },
  rejected: { className: 'bg-red-100 text-red-600 border border-red-200', label: 'Rejected' },
};

interface StatusBadgeProps {
  status: PlaceStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const style = STYLES[status] || STYLES.pending;
  const sizeClasses = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClasses} ${style.className}`}>
      {style.label}
    </span>
  );
}
