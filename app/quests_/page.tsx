"use client";

import { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "../components/DashboardLayout";
import Quest_FormModal, { Quest_ } from "../components/modals/Quest_FormModal";
import DeleteDialog from "../components/ui/DeleteDialog";
import Toaster from "../components/ui/Toaster";
import { AppDispatch, RootState } from "../store";
import {
  fetchQuests,
  createQuest,
  updateQuest,
  deleteQuest,
  clearError,
} from "../store/slices/questsSlice";
import { fetchPlaces } from "../store/slices/placesSlice";

export default function Quests_Page() {
  const dispatch = useDispatch<AppDispatch>();
  const { quests, loading, error } = useSelector((state: RootState) => state.quests);
  const { places } = useSelector((state: RootState) => state.places);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest_ | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [questToDelete, setQuestToDelete] = useState<Quest_ | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', isVisible: false });

  useEffect(() => {
    dispatch(fetchQuests());
    dispatch(fetchPlaces());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error', isVisible: true });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Helper function to get place name from placeId
  const getPlaceName = (placeId: string | null) => {
    if (!placeId) return null;
    const place = places.find(p => p.placeId === placeId);
    return place?.name || placeId;
  };

  const formatCooldown = (seconds: number) => {
    if (seconds >= 86400) return `${Math.floor(seconds / 86400)}d`;
    if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h`;
    if (seconds >= 60) return `${Math.floor(seconds / 60)}m`;
    return `${seconds}s`;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      checkin_time: "bg-blue-100 text-blue-700",
      qr_scan: "bg-emerald-100 text-emerald-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const handleCreateQuest = useCallback(() => {
    setSelectedQuest(null);
    setIsModalOpen(true);
  }, []);

  const handleEditQuest = useCallback((quest: Quest_) => {
    setSelectedQuest(quest);
    setIsModalOpen(true);
  }, []);

  const handleSubmitQuest = useCallback(async (quest: Quest_) => {
    try {
      if (selectedQuest) {
        await dispatch(updateQuest(quest)).unwrap();
        setToast({ message: 'Quest updated successfully', type: 'success', isVisible: true });
      } else {
        await dispatch(createQuest(quest)).unwrap();
        setToast({ message: 'Quest created successfully', type: 'success', isVisible: true });
      }
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : 'An error occurred';
      setToast({ message: errorMessage, type: 'error', isVisible: true });
    }
    setIsModalOpen(false);
    setSelectedQuest(null);
  }, [selectedQuest, dispatch]);

  const handleDeleteClick = useCallback((quest: Quest_) => {
    setQuestToDelete(quest);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!questToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteQuest(questToDelete.questId)).unwrap();
      setToast({ message: 'Quest deleted successfully', type: 'success', isVisible: true });
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : 'Failed to delete quest';
      setToast({ message: errorMessage, type: 'error', isVisible: true });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setQuestToDelete(null);
    }
  }, [questToDelete, dispatch]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setQuestToDelete(null);
  }, []);

  return (
    <DashboardLayout>
      <div className="w-full p-4 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Quests</h1>
            <p className="text-gray-500 text-sm">Manage XP-earning mechanics</p>
          </div>
          <button
            onClick={handleCreateQuest}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New Quest</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : quests.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 py-12 text-center">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 font-medium">No quests yet</p>
            <p className="text-gray-400 text-sm">Create your first quest</p>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="lg:hidden space-y-2">
              {quests.map((quest) => (
                <div key={quest.questId} className="bg-white rounded-lg border border-gray-200 p-3">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">{quest.title}</h3>
                    <span className={`shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full ${quest.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {quest.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{quest.description}</p>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-400 block text-[10px] mb-0.5">Type</span>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${getTypeColor(quest.type)}`}>
                        {quest.type.replace("_", " ")}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-400 block text-[10px] mb-0.5">
                        {quest.type === 'checkin_time' ? 'Min Time' : 'XP Reward'}
                      </span>
                      <span className={quest.type === 'checkin_time' ? 'text-blue-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {quest.type === 'checkin_time'
                          ? `${quest.requirements?.minTimeSeconds || 0}s`
                          : `${quest.xpReward} XP`}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-400 block text-[10px] mb-0.5">Cooldown</span>
                      <span className="text-gray-700 font-medium">{formatCooldown(quest.cooldownSeconds)}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-400 block text-[10px] mb-0.5">Place</span>
                      <span className="text-gray-700 font-medium truncate block">{getPlaceName(quest.placeId) || <span className="text-gray-400">None</span>}</span>
                    </div>
                  </div>

                  {/* Duration */}
                  {(quest.startAt || quest.endAt) && (
                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 mb-2 text-xs">
                      <span className="text-gray-400 block text-[10px] mb-0.5">Duration</span>
                      <div className="text-gray-700 font-medium">
                        {quest.startAt && <span>Start: {new Date(quest.startAt).toLocaleDateString()}</span>}
                        {quest.startAt && quest.endAt && <span className="mx-1">—</span>}
                        {quest.endAt && <span>End: {new Date(quest.endAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  )}

                  {/* Requirements */}
                  {Object.keys(quest.requirements).length > 0 && (
                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 mb-2 text-xs">
                      <span className="text-gray-400 block text-[10px] mb-0.5">Requirements</span>
                      <code className="text-gray-600 font-mono text-[10px] block overflow-x-auto" title={JSON.stringify(quest.requirements)}>{JSON.stringify(quest.requirements)}</code>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button onClick={() => handleEditQuest(quest as Quest_)} className="flex-1 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteClick(quest as Quest_)} className="flex-1 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Quest</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Type</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Place</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Min Time</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Cooldown</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Status</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Duration</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Requirements</th>
                    <th className="text-center font-medium text-gray-600 px-3 py-2.5 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quests.map((quest) => (
                    <tr key={quest.questId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-900">{quest.title}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[180px]">{quest.description}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(quest.type)}`}>
                          {quest.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-gray-700 text-xs">
                          {getPlaceName(quest.placeId) || <span className="text-gray-400">None</span>}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {quest.type === 'checkin_time' ? (
                          <span className="font-medium text-blue-600">{quest.requirements?.minTimeSeconds || 0}s</span>
                        ) : (
                          <span className="font-medium text-gray-900">{quest.xpReward}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-gray-700">{formatCooldown(quest.cooldownSeconds)}</span>
                        <span className="text-gray-400 text-xs ml-1">({quest.cooldownSeconds}s)</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${quest.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                          {quest.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-xs text-gray-600">
                          {quest.startAt && <div>Start: {new Date(quest.startAt).toLocaleDateString()}</div>}
                          {quest.endAt && <div>End: {new Date(quest.endAt).toLocaleDateString()}</div>}
                          {!quest.startAt && !quest.endAt && <span className="text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <code className="text-xs text-gray-600 bg-gray-50 rounded px-1.5 py-0.5 inline-block max-w-[120px] truncate" title={JSON.stringify(quest.requirements)}>
                          {JSON.stringify(quest.requirements)}
                        </code>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEditQuest(quest as Quest_)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDeleteClick(quest as Quest_)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Quest_FormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedQuest(null); }}
        onSubmit={handleSubmitQuest}
        quest={selectedQuest}
      />

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Quest"
        message="Are you sure you want to delete this quest? This action cannot be undone."
        itemName={questToDelete?.title}
        isDeleting={isDeleting}
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
