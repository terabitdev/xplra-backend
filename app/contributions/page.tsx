"use client";

import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DashboardLayout from '../components/DashboardLayout';
import Toaster from '../components/ui/Toaster';
import Pagination from '../components/ui/Pagination';
import CardSkeleton from '../components/ui/CardSkeleton';
import PlaceFormModal, { Place_ } from '../components/modals/PlaceFormModal';
import ContributionCard from '../components/contributions/ContributionCard';
import ContributionDetailsDialog from '../components/contributions/ContributionDetailsDialog';
import RejectConfirmDialog from '../components/contributions/RejectConfirmDialog';
import ApproveXpDialog from '../components/contributions/ApproveXpDialog';
import { AppDispatch, RootState } from '../store';
import {
  fetchContributions,
  fetchContributionCounts,
  rejectContribution,
  approveContribution,
  setTab,
  setPage,
  clearError,
  ContributionTab,
} from '../store/slices/contributionsSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { fetchValidationConfigs } from '../store/slices/validationConfigsSlice';
import { updatePlace } from '../store/slices/placesSlice';
import { Place } from '@/lib/domain/models/place';

const ITEMS_PER_PAGE = 12;
const BANNER_DISMISSED_KEY = 'contributions.banner.dismissed';

const TAB_CONFIG: Array<{ key: ContributionTab; label: string; emptyTitle: string; emptySubtitle: string }> = [
  { key: 'all', label: 'All', emptyTitle: 'No contributions yet', emptySubtitle: 'User submissions will appear here.' },
  { key: 'pending', label: 'Pending', emptyTitle: 'No pending contributions', emptySubtitle: 'You are all caught up.' },
  { key: 'approved', label: 'Approved', emptyTitle: 'No approved contributions', emptySubtitle: 'Approved places will appear here.' },
  { key: 'rejected', label: 'Rejected', emptyTitle: 'No rejected contributions', emptySubtitle: 'Rejected submissions will appear here.' },
];

export default function ContributionsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { contributions, submitters, loading, error, pagination, counts, currentTab } = useSelector(
    (state: RootState) => state.contributions,
  );
  const { categories } = useSelector((state: RootState) => state.categories);
  const { configs: validationConfigs } = useSelector((state: RootState) => state.validationConfigs);

  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', isVisible: false });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsMode, setDetailsMode] = useState<'review' | 'view'>('review');
  const [selected, setSelected] = useState<Place | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [editPlaceOpen, setEditPlaceOpen] = useState(false);
  const [editPlace, setEditPlace] = useState<Place_ | null>(null);
  const [needsCompletionCount, setNeedsCompletionCount] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, isVisible: true });
  }, []);

  const refreshCounts = useCallback(() => {
    dispatch(fetchContributionCounts());
    fetch('/api/places/count?source=user_contribution&status=approved')
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((d) => setNeedsCompletionCount(d.count || 0))
      .catch(() => setNeedsCompletionCount(0));
  }, [dispatch]);

  const refreshList = useCallback(() => {
    dispatch(fetchContributions({ tab: currentTab, page: pagination.page, limit: ITEMS_PER_PAGE }));
  }, [dispatch, currentTab, pagination.page]);

  useEffect(() => {
    dispatch(fetchContributions({ tab: currentTab, page: pagination.page, limit: ITEMS_PER_PAGE }));
  }, [dispatch, currentTab, pagination.page]);

  useEffect(() => {
    refreshCounts();
    if (categories.length === 0) dispatch(fetchCategories());
    if (validationConfigs.length === 0) dispatch(fetchValidationConfigs({ fresh: true }));
    if (typeof window !== 'undefined') {
      setBannerDismissed(window.localStorage.getItem(BANNER_DISMISSED_KEY) === '1');
    }
  }, [dispatch, refreshCounts, categories.length, validationConfigs.length]);

  useEffect(() => {
    if (error) {
      showToast(error, 'error');
      dispatch(clearError());
    }
  }, [error, dispatch, showToast]);

  const handleTabChange = (tab: ContributionTab) => {
    dispatch(setTab(tab));
  };

  const handlePageChange = (page: number) => {
    dispatch(setPage(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCardAction = (contribution: Place) => {
    setSelected(contribution);
    setDetailsMode(contribution.status === 'pending' ? 'review' : 'view');
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelected(null);
  };

  const handleStartReject = (contribution: Place) => {
    setSelected(contribution);
    setRejectOpen(true);
  };

  const handleConfirmReject = async (rejectionReason: string) => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await dispatch(rejectContribution({ placeId: selected.placeId, rejectionReason })).unwrap();
      setRejectOpen(false);
      setDetailsOpen(false);
      setSelected(null);
      showToast('Contribution rejected', 'success');
      refreshCounts();
      refreshList();
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Failed to reject';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartApprove = (contribution: Place) => {
    setSelected(contribution);
    setApproveOpen(true);
  };

  const handleConfirmApprove = async (contributionXp: number) => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await dispatch(approveContribution({ placeId: selected.placeId, contributionXp })).unwrap();
      setApproveOpen(false);
      setDetailsOpen(false);

      const approvedPlace: Place_ = {
        ...(selected as unknown as Place_),
        status: 'approved',
        contributionXp,
      };
      setEditPlace(approvedPlace);
      setEditPlaceOpen(true);
      refreshCounts();
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Failed to approve';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPlaceSubmit = async (place: Place_, imageFiles: File[]) => {
    try {
      await dispatch(updatePlace({ placeData: place as unknown as Place, imageFiles })).unwrap();
      setEditPlaceOpen(false);
      setEditPlace(null);
      setSelected(null);
      showToast('Place is now live!', 'success');
      refreshCounts();
      refreshList();
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Failed to save place';
      showToast(msg, 'error');
    }
  };

  const handleEditPlaceClose = () => {
    setEditPlaceOpen(false);
    setEditPlace(null);
    setSelected(null);
    refreshCounts();
    refreshList();
  };

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(BANNER_DISMISSED_KEY, '1');
    }
  };

  const activeTabConfig = TAB_CONFIG.find((t) => t.key === currentTab) || TAB_CONFIG[1];
  const showBanner = needsCompletionCount > 0 && !bannerDismissed;

  return (
    <DashboardLayout>
      <div className="w-full p-4 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Place Contributions</h1>
            <p className="text-gray-500 text-sm">Review user-submitted places</p>
          </div>

          <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-lg text-sm">
            {TAB_CONFIG.map((t) => {
              const count = counts[t.key];
              const isActive = currentTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleTabChange(t.key)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    isActive ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {t.label} <span className={isActive ? 'text-gray-500' : 'text-gray-400'}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {showBanner && (
          <div className="flex items-start gap-3 px-4 py-2.5 mb-4 bg-amber-50 border border-amber-200 rounded-lg">
            <svg className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z" />
            </svg>
            <div className="flex-1 text-sm text-amber-800">
              {needsCompletionCount} approved contribution{needsCompletionCount === 1 ? '' : 's'} need{needsCompletionCount === 1 ? 's' : ''} completion.
              {' '}
              Find {needsCompletionCount === 1 ? 'it' : 'them'} in the Approved tab or{' '}
              <a href="/places_" className="font-semibold underline">manage from Places →</a>
            </div>
            <button
              type="button"
              onClick={handleDismissBanner}
              className="text-amber-700 hover:text-amber-900 text-xs font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Card grid */}
        {loading && contributions.length === 0 ? (
          <CardSkeleton count={6} />
        ) : contributions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 py-16 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 font-medium">{activeTabConfig.emptyTitle}</p>
            <p className="text-gray-400 text-sm">{activeTabConfig.emptySubtitle}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contributions.map((c) => (
                <ContributionCard
                  key={c.placeId}
                  contribution={c}
                  submitterName={c.userId ? submitters[c.userId]?.displayName || undefined : undefined}
                  onAction={handleCardAction}
                />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
              />
            )}
          </>
        )}
      </div>

      <ContributionDetailsDialog
        isOpen={detailsOpen}
        mode={detailsMode}
        contribution={selected}
        categories={categories}
        onClose={handleCloseDetails}
        onReject={handleStartReject}
        onApprove={handleStartApprove}
        onToast={showToast}
      />

      <RejectConfirmDialog
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleConfirmReject}
        loading={actionLoading}
      />

      <ApproveXpDialog
        isOpen={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={handleConfirmApprove}
        loading={actionLoading}
      />

      <PlaceFormModal
        isOpen={editPlaceOpen}
        onClose={handleEditPlaceClose}
        onSubmit={handleEditPlaceSubmit}
        place={editPlace}
        availableCategories={categories}
        availableValidationConfigs={validationConfigs}
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
