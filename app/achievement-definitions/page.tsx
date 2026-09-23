"use client";

import { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import DashboardLayout from "../components/DashboardLayout";
import AchievementDefinitionFormModal from "../components/modals/AchievementDefinitionFormModal";
import DeleteDialog from "../components/ui/DeleteDialog";
import Toaster from "../components/ui/Toaster";
import CardSkeleton from "../components/ui/CardSkeleton";
import TableSkeleton from "../components/ui/TableSkeleton";
import { AppDispatch, RootState } from "../store";
import { useAppSelector } from "../store/hooks";
import {
  fetchAchievementDefinitions,
  createAchievementDefinition,
  updateAchievementDefinition,
  deleteAchievementDefinition,
  clearError,
} from "../store/slices/achievementDefinitionsSlice";
import { AchievementDefinition } from "@/lib/domain/models/achievementDefinition";

function getRarityStyle(rarity: string) {
  const styles: Record<string, string> = {
    COMMON: "bg-gray-100 text-gray-600",
    UNCOMMON: "bg-green-100 text-green-700",
    RARE: "bg-blue-100 text-blue-700",
    EPIC: "bg-purple-100 text-purple-700",
    LEGENDARY: "bg-amber-100 text-amber-700",
  };
  return styles[rarity] || "bg-gray-100 text-gray-600";
}

function getStatusStyle(status: string) {
  const styles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-500",
    PUBLISHED: "bg-green-100 text-green-700",
    ARCHIVED: "bg-red-100 text-red-600",
  };
  return styles[status] || "bg-gray-100 text-gray-600";
}

function isRenderableImageUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/');
}

// Hosts allowlisted in next.config.js — anything else must fall back to a
// plain <img>, since next/image throws (not just degrades) on an
// unconfigured hostname. Older achievement records, from before this tab
// uploaded real files, can point at arbitrary external hosts (flaticon,
// gstatic, ...), so this can't be a fixed allowlist of "expected" domains.
const OPTIMIZED_IMAGE_HOSTS = ['storage.googleapis.com', 'firebasestorage.googleapis.com', 'picsum.photos'];

function isOptimizableImageUrl(value: string): boolean {
  try {
    return OPTIMIZED_IMAGE_HOSTS.includes(new URL(value).hostname);
  } catch {
    return false; // relative paths, e.g. "/foo.png" — next/image handles these fine too
  }
}

function BadgeThumbnail({ definition, size }: { definition: AchievementDefinition; size: number }) {
  const candidate = definition.badge_asset_url || definition.thumbnail_url || '';
  // Older records (created before this tab had real uploads) may have plain
  // text — e.g. "abc" — saved where a URL belongs. next/image throws on
  // anything that isn't a real path or absolute URL, so guard it here.
  const src = isRenderableImageUrl(candidate) ? candidate : '';

  if (!src) {
    return (
      <div
        className="shrink-0 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg className="w-1/2 h-1/2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className="relative shrink-0 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden"
      style={{ width: size, height: size }}
    >
      {isOptimizableImageUrl(src) ? (
        <Image src={src} alt={definition.title} fill className="object-contain p-1" sizes={`${size}px`} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={definition.title} className="w-full h-full object-contain p-1" />
      )}
    </div>
  );
}

export default function AchievementDefinitionsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { definitions, loading, error } = useSelector((state: RootState) => state.achievementDefinitions);
  const { uid } = useAppSelector((state) => state.user);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState<AchievementDefinition | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [definitionToDelete, setDefinitionToDelete] = useState<AchievementDefinition | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", isVisible: false });

  useEffect(() => {
    if (definitions.length === 0) {
      dispatch(fetchAchievementDefinitions());
    }
  }, [dispatch, definitions.length]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: "error", isVisible: true });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleCreate = useCallback(() => {
    setSelectedDefinition(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((definition: AchievementDefinition) => {
    setSelectedDefinition(definition);
    setIsModalOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      try {
        if (selectedDefinition) {
          await dispatch(updateAchievementDefinition({ id: selectedDefinition.id, formData })).unwrap();
          setToast({ message: "Achievement updated successfully", type: "success", isVisible: true });
        } else {
          // Inject the current admin's uid as created_by into the JSON payload before sending.
          const payload = JSON.parse((formData.get("data") as string) || "{}");
          formData.set("data", JSON.stringify({ ...payload, created_by: uid || "" }));
          await dispatch(createAchievementDefinition(formData)).unwrap();
          setToast({ message: "Achievement created successfully", type: "success", isVisible: true });
        }
      } catch (err) {
        const errorMessage = typeof err === "string" ? err : "An error occurred";
        setToast({ message: errorMessage, type: "error", isVisible: true });
      }
      setIsModalOpen(false);
      setSelectedDefinition(null);
    },
    [selectedDefinition, dispatch, uid]
  );

  const handleDeleteClick = useCallback((definition: AchievementDefinition) => {
    setDefinitionToDelete(definition);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!definitionToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteAchievementDefinition(definitionToDelete.id)).unwrap();
      setToast({ message: "Achievement deleted successfully", type: "success", isVisible: true });
    } catch (err) {
      const errorMessage = typeof err === "string" ? err : "Failed to delete achievement";
      setToast({ message: errorMessage, type: "error", isVisible: true });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setDefinitionToDelete(null);
    }
  }, [definitionToDelete, dispatch]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setDefinitionToDelete(null);
  }, []);

  const showInitialLoading = loading && definitions.length === 0;

  return (
    <DashboardLayout>
      <div className="w-full p-4 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Achievement Definitions</h1>
            <p className="text-gray-500 text-sm">
              Define the achievements players can unlock
              {definitions.length > 0 && <span className="ml-2 text-gray-400">({definitions.length} total)</span>}
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New Achievement</span>
          </button>
        </div>

        {showInitialLoading ? (
          <>
            <div className="lg:hidden">
              <CardSkeleton count={6} showImage={false} />
            </div>
            <div className="hidden lg:block">
              <TableSkeleton rows={8} columns={6} showImage={false} />
            </div>
          </>
        ) : definitions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 py-12 text-center">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-gray-500 font-medium">No achievements yet</p>
            <p className="text-gray-400 text-sm">Create your first achievement</p>
          </div>
        ) : (
          <>
            {loading && definitions.length > 0 && (
              <div className="fixed inset-0 bg-white/50 z-10 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            )}

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-2">
              {definitions.map((def) => (
                <div key={def.id} className="bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex items-start gap-3 mb-2">
                    <BadgeThumbnail definition={def} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">{def.title}</h3>
                        <span className="shrink-0 text-xs font-medium text-amber-600">+{def.xp_reward} XP</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{def.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${getRarityStyle(def.rarity)}`}>{def.rarity}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${getStatusStyle(def.status)}`}>{def.status}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-600">{def.category}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(def)} className="flex-1 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteClick(def)} className="flex-1 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
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
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Title</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Category</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Rarity</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Status</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">XP Reward</th>
                    <th className="text-center font-medium text-gray-600 px-3 py-2.5 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {definitions.map((def) => (
                    <tr key={def.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <BadgeThumbnail definition={def} size={36} />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">{def.title}</p>
                            <p className="text-xs text-gray-400 truncate max-w-xs">{def.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs text-gray-700">{def.category}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getRarityStyle(def.rarity)}`}>{def.rarity}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(def.status)}`}>{def.status}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-sm font-medium text-amber-600">+{def.xp_reward} XP</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEdit(def)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDeleteClick(def)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
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

      <AchievementDefinitionFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedDefinition(null); }}
        onSubmit={handleSubmit}
        definition={selectedDefinition}
      />

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Achievement"
        message="Are you sure you want to delete this achievement? This action cannot be undone."
        itemName={definitionToDelete?.title}
        isDeleting={isDeleting}
      />

      <Toaster
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((t) => ({ ...t, isVisible: false }))}
      />
    </DashboardLayout>
  );
}
