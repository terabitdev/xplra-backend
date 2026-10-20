'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import Toaster from '../../components/ui/Toaster';
import XpAdjustmentModal from '../../components/modals/XpAdjustmentModal';
import { AppDispatch, RootState } from '../../store';
import { fetchXpLedger, clearEntries } from '../../store/slices/xpLedgerSlice';
import { GrantManualXpResult } from '@/lib/utils/grantManualXp';
import { ArrowLeft, Add } from '@carbon/icons-react';

const REWARD_STATE_MESSAGES: Record<GrantManualXpResult['reward_state'], (result: GrantManualXpResult) => string> = {
  granted: (r) => `XP adjustment applied — ${r.xp_awarded} XP credited.`,
  capped: (r) => `The daily limit was reached — only ${r.xp_awarded} of ${r.xp_requested} XP was credited.`,
  none: () => 'No XP was credited for this adjustment.',
  blocked: () => "This account is locked — nothing was credited.",
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const uid = params.uid as string;

  const { entries, summary, loading, error } = useSelector(
    (state: RootState) => state.xpLedger
  );

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', isVisible: false });

  useEffect(() => {
    if (uid) {
      dispatch(fetchXpLedger({ uid, limit: 100 }));
    }

    return () => {
      dispatch(clearEntries());
    };
  }, [uid, dispatch]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error', isVisible: true });
    }
  }, [error]);

  const handleAdjustmentSuccess = (result: GrantManualXpResult) => {
    const message = REWARD_STATE_MESSAGES[result.reward_state]?.(result) || 'XP adjustment applied.';
    setToast({ message, type: result.reward_state === 'granted' ? 'success' : 'error', isVisible: true });
    dispatch(fetchXpLedger({ uid, limit: 100 }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // The ledger's transaction type is whatever the game wrote (quest, achievement,
  // daily login, admin adjustment, ...) — colored generically since the panel
  // doesn't own that enum anymore.
  const getTypeColor = (type?: string) => {
    if (!type) return 'bg-gray-100 text-gray-700';
    return type.toLowerCase() === 'admin adjustment' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';
  };

  return (
    <DashboardLayout>
      <div className="w-full p-4 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="mb-4">
          <button
            onClick={() => router.push('/users')}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-3 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Users
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">XP Ledger</h1>
              <p className="text-gray-500 text-sm font-mono mt-1">{uid}</p>
            </div>

            <button
              onClick={() => setIsAdjustmentModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Add size={18} />
              Adjust XP
            </button>
          </div>
        </div>

        {/* XP Summary Cards — xp_total/level/node/xp_into_level/xp_to_next are
            written only by the game's Cloud Functions; the panel just reads them. */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-gray-500 text-sm font-medium">XP Total</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{summary.xp_total.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-gray-500 text-sm font-medium">Level</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{summary.level.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-gray-500 text-sm font-medium">XP Into Level</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">{summary.xp_into_level?.toLocaleString() ?? '—'}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-gray-500 text-sm font-medium">XP To Next</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">{summary.xp_to_next?.toLocaleString() ?? '—'}</p>
          </div>
        </div>

        {/* Transaction History */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 py-12 text-center">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 font-medium">No XP transactions yet</p>
            <p className="text-gray-400 text-sm">Transactions will appear here</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Related Entity</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">XP Awarded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {entries.map((entry) => {
                      const xpAwarded = entry.xp_awarded ?? entry.amount;
                      return (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDate(entry.createdAt ?? undefined)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(entry.transactionType)}`}>
                              {entry.transactionType || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{entry.reason || '—'}</td>
                          <td className="px-4 py-3">
                            {entry.relatedEntityId ? (
                              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {entry.relatedEntityId}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-green-600">
                              {typeof xpAwarded === 'number' ? `+${xpAwarded.toLocaleString()}` : '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {entries.map((entry) => {
                const xpAwarded = entry.xp_awarded ?? entry.amount;
                return (
                  <div key={entry.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(entry.transactionType)}`}>
                        {entry.transactionType || '—'}
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {typeof xpAwarded === 'number' ? `+${xpAwarded.toLocaleString()}` : '—'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mb-2">{entry.reason || '—'}</p>

                    {entry.relatedEntityId && (
                      <p className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block mb-2">
                        {entry.relatedEntityId}
                      </p>
                    )}

                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-gray-400 text-xs block">Date</span>
                      <span className="text-gray-700 text-xs">{formatDate(entry.createdAt ?? undefined)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* XP Adjustment Modal */}
      <XpAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSuccess={handleAdjustmentSuccess}
        uid={uid}
      />

      <Toaster
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </DashboardLayout>
  );
}
