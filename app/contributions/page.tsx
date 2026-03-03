"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "../components/DashboardLayout";
import DeleteDialog from "../components/ui/DeleteDialog";
import Toaster from "../components/ui/Toaster";
import Pagination from "../components/ui/Pagination";
import CardSkeleton from "../components/ui/CardSkeleton";
import { AppDispatch, RootState } from "../store";
import {
  fetchContributions,
  reviewContribution,
  deleteContribution,
  clearError,
} from "../store/slices/contributionsSlice";
import { fetchCategories } from "../store/slices/categoriesSlice";
import { PlaceContribution } from "@/lib/domain/models/placeContribution";

export default function ContributionsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { contributions, loading, error, pagination, lastFetched } = useSelector((state: RootState) => state.contributions);
  const { categories } = useSelector((state: RootState) => state.categories);

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
  const resolveCatName = useCallback((id: string) => categoryMap.get(id) || id, [categoryMap]);

  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [selectedContribution, setSelectedContribution] = useState<PlaceContribution | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', isVisible: false });
  const [currentPage, setCurrentPage] = useState(1);

  // Check if data is stale (older than 5 minutes)
  const isDataStale = !lastFetched || (Date.now() - lastFetched > 5 * 60 * 1000);

  // Fetch contributions on mount or when page/filter changes
  useEffect(() => {
    if (contributions.length === 0 || isDataStale || pagination.page !== currentPage) {
      dispatch(fetchContributions({ page: currentPage, limit: 20 }));
    }
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    dispatch(fetchContributions({ page, limit: 20 }));
  };

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error', isVisible: true });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const filteredContributions = contributions.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-600",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const handleReviewClick = useCallback((contribution: PlaceContribution, action: "approve" | "reject") => {
    setSelectedContribution(contribution);
    setReviewAction(action);
    setReviewNote("");
    setIsReviewDialogOpen(true);
  }, []);

  const handleConfirmReview = useCallback(async () => {
    if (!selectedContribution) return;
    setIsDeleting(true);
    try {
      await dispatch(reviewContribution({
        contributionId: selectedContribution.contributionId,
        action: reviewAction,
        reviewNote,
        adminUid: "admin_uid_placeholder", // Should be from auth context
      })).unwrap();
      setToast({ message: `Contribution ${reviewAction}d successfully`, type: 'success', isVisible: true });
      dispatch(fetchContributions({ page: currentPage, limit: 20, fresh: true }));
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : 'Failed to review contribution';
      setToast({ message: errorMessage, type: 'error', isVisible: true });
    } finally {
      setIsDeleting(false);
      setIsReviewDialogOpen(false);
      setSelectedContribution(null);
      setReviewNote("");
    }
  }, [selectedContribution, reviewAction, reviewNote, dispatch]);

  const handleCancelReview = useCallback(() => {
    setIsReviewDialogOpen(false);
    setSelectedContribution(null);
    setReviewNote("");
  }, []);

  return (
    <DashboardLayout>
      <div className="w-full p-4 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Place Contributions</h1>
            <p className="text-gray-500 text-sm">Review user-submitted places</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg text-sm">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-md transition-colors ${filter === "all" ? "bg-white shadow-sm font-medium" : "text-gray-600"}`}
            >
              All ({contributions.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-3 py-1.5 rounded-md transition-colors ${filter === "pending" ? "bg-white shadow-sm font-medium" : "text-gray-600"}`}
            >
              Pending ({contributions.filter(c => c.status === "pending").length})
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`px-3 py-1.5 rounded-md transition-colors ${filter === "approved" ? "bg-white shadow-sm font-medium" : "text-gray-600"}`}
            >
              Approved ({contributions.filter(c => c.status === "approved").length})
            </button>
            <button
              onClick={() => setFilter("rejected")}
              className={`px-3 py-1.5 rounded-md transition-colors ${filter === "rejected" ? "bg-white shadow-sm font-medium" : "text-gray-600"}`}
            >
              Rejected ({contributions.filter(c => c.status === "rejected").length})
            </button>
          </div>
        </div>

        {loading && contributions.length === 0 ? (
          <CardSkeleton count={6} />
        ) : filteredContributions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 py-12 text-center">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 font-medium">No contributions yet</p>
            <p className="text-gray-400 text-sm">User submissions will appear here</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {filteredContributions.map((contribution) => (
                <div key={contribution.contributionId} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Place Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{contribution.placeDraft.name}</h3>
                          <p className="text-xs text-gray-400 font-mono mt-1">{contribution.contributionId}</p>
                        </div>
                        <span className={`shrink-0 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contribution.status)}`}>
                          {contribution.status}
                        </span>
                      </div>

                      {contribution.placeDraft.description && (
                        <p className="text-sm text-gray-600 mb-2">{contribution.placeDraft.description}</p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400 text-xs">Location</span>
                          <p className="text-gray-700 font-mono text-xs">
                            {contribution.placeDraft.geo?.lat.toFixed(4)}, {contribution.placeDraft.geo?.lng.toFixed(4)}
                          </p>
                        </div>
                        {contribution.placeDraft.location && (
                          <div>
                            <span className="text-gray-400 text-xs">Location</span>
                            <p className="text-gray-700 text-xs">{contribution.placeDraft.location}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-400 text-xs">Submitted By</span>
                          <p className="text-gray-700 font-mono text-xs">{contribution.uid}</p>
                        </div>
                        {contribution.createdAt && (
                          <div>
                            <span className="text-gray-400 text-xs">Submitted</span>
                            <p className="text-gray-700 text-xs">{new Date(contribution.createdAt).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>

                      {contribution.placeDraft.categorySelections && contribution.placeDraft.categorySelections.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {contribution.placeDraft.categorySelections.map((cs) => (
                            <span key={cs.selectedId} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{resolveCatName(cs.selectedId)}</span>
                          ))}
                        </div>
                      )}

                      {contribution.reviewNote && (
                        <div className="mt-2 p-2 bg-gray-50 rounded border-l-2 border-gray-300">
                          <span className="text-xs text-gray-500 font-medium">Review Note:</span>
                          <p className="text-sm text-gray-700 mt-0.5">{contribution.reviewNote}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {contribution.status === "pending" && (
                      <div className="flex lg:flex-col gap-2 lg:w-32">
                        <button
                          onClick={() => handleReviewClick(contribution, "approve")}
                          className="flex-1 lg:w-full py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReviewClick(contribution, "reject")}
                          className="flex-1 lg:w-full py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
              />
            )}
          </>
        )}
      </div>

      {/* Review Dialog */}
      {isReviewDialogOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-3">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {reviewAction === "approve" ? "Approve" : "Reject"} Contribution
              </h2>
            </div>

            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3">
                {reviewAction === "approve"
                  ? "This will create a new place in the main places collection."
                  : "This will mark the contribution as rejected."}
              </p>

              <label className="block text-xs font-medium text-gray-600 mb-1">
                Review Note {reviewAction === "reject" && <span className="text-red-500">*</span>}
              </label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={reviewAction === "approve" ? "Optional note" : "Reason for rejection"}
              />
            </div>

            <div className="flex gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={handleCancelReview}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReview}
                className={`flex-1 px-3 py-2 text-sm text-white rounded-lg transition-colors font-medium disabled:opacity-50 ${
                  reviewAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }`}
                disabled={isDeleting || (reviewAction === "reject" && !reviewNote.trim())}
              >
                {isDeleting ? "Processing..." : (reviewAction === "approve" ? "Approve" : "Reject")}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </DashboardLayout>
  );
}
