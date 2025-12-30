'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import Toaster from '../../components/ui/Toaster';
import XpAdjustmentModal from '../../components/modals/XpAdjustmentModal';
import { AppDispatch, RootState } from '../../store';
import { fetchXpLedger, clearEntries } from '../../store/slices/xpLedgerSlice';
import { ArrowLeft, Add } from '@carbon/icons-react';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const uid = params.uid as string;

  const { entries, userXpTotal, userXpEarnedAllTime, loading, error } = useSelector(
    (state: RootState) => state.xpLedger
  );

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', isVisible: false });

  useEffect(() => {
    if (uid) {
      dispatch(fetchXpLedger({ uid, limit: 100, type: filterType === 'all' ? undefined : filterType }));
    }

    return () => {
      dispatch(clearEntries());
    };
  }, [uid, filterType, dispatch]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error', isVisible: true });
    }
  }, [error]);

  const handleAdjustmentSuccess = () => {
    setToast({ message: 'XP adjustment applied successfully', type: 'success', isVisible: true });
    dispatch(fetchXpLedger({ uid, limit: 100, type: filterType === 'all' ? undefined : filterType }));
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

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      quest_complete: 'bg-blue-100 text-blue-700',
      quest_first_completion_bonus: 'bg-purple-100 text-purple-700',
      place_contribution_approved: 'bg-green-100 text-green-700',
      daily_login: 'bg-yellow-100 text-yellow-700',
      admin_adjustment: 'bg-orange-100 text-orange-700',
      referral_bonus: 'bg-pink-100 text-pink-700',
      achievement_unlock: 'bg-indigo-100 text-indigo-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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

        {/* XP Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-gray-500 text-sm font-medium">Current XP Total</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{userXpTotal.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-gray-500 text-sm font-medium">Total XP Earned</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{userXpEarnedAllTime.toLocaleString()}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-lg text-sm">
            {['all', 'quest_complete', 'place_contribution_approved', 'admin_adjustment', 'daily_login'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  filterType === type ? 'bg-white shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {type === 'all' ? 'All' : getTypeLabel(type)}
              </button>
            ))}
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Related Entity</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">XP Delta</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {entries.map((entry) => (
                      <tr key={entry.entryId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(entry.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(entry.type)}`}>
                            {getTypeLabel(entry.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{entry.description}</td>
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
                          <span className={`text-sm font-semibold ${entry.xpDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {entry.xpDelta >= 0 ? '+' : ''}{entry.xpDelta.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {entry.xpTotalAfter.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {entries.map((entry) => (
                <div key={entry.entryId} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(entry.type)}`}>
                      {getTypeLabel(entry.type)}
                    </span>
                    <span className={`text-lg font-bold ${entry.xpDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {entry.xpDelta >= 0 ? '+' : ''}{entry.xpDelta.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-2">{entry.description}</p>

                  {entry.relatedEntityId && (
                    <p className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block mb-2">
                      {entry.relatedEntityId}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-gray-400 text-xs block">Balance After</span>
                      <span className="text-gray-900 font-medium">{entry.xpTotalAfter.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block">Date</span>
                      <span className="text-gray-700 text-xs">{formatDate(entry.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
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
