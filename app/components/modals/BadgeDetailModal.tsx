"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AchievementDefinition } from "@/lib/domain/models/achievementDefinition";
import DeleteDialog from "../ui/DeleteDialog";

interface BadgeDetailModalProps {
  achievementId: string;
  assignedAt: string | null;
  uid: string;
  adminUid: string;
  onClose: () => void;
  onRemoved: (achievementId: string) => void;
}

function isRenderableImageUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/");
}

const OPTIMIZED_IMAGE_HOSTS = ["storage.googleapis.com", "firebasestorage.googleapis.com", "picsum.photos"];

function isOptimizableImageUrl(value: string): boolean {
  try {
    return OPTIMIZED_IMAGE_HOSTS.includes(new URL(value).hostname);
  } catch {
    return false;
  }
}

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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-sm text-gray-800 text-right">{value}</span>
    </div>
  );
}

export default function BadgeDetailModal({ achievementId, assignedAt, uid, adminUid, onClose, onRemoved }: BadgeDetailModalProps) {
  const [definition, setDefinition] = useState<AchievementDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleConfirmRemove = async () => {
    setIsRemoving(true);
    try {
      const res = await fetch(`/api/achievement-definitions/${achievementId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, assign: false, adminUid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove badge");
      onRemoved(achievementId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove badge");
      setIsConfirmingRemove(false);
    } finally {
      setIsRemoving(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/achievement-definitions/${achievementId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load achievement details");
        if (!cancelled) setDefinition(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load achievement details");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [achievementId]);

  const imageSrc = definition ? definition.badge_asset_url || definition.thumbnail_url || "" : "";
  const showImage = imageSrc && isRenderableImageUrl(imageSrc);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-3"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Achievement Details</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsConfirmingRemove(true)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove this badge from the user"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-20 w-20 bg-gray-100 rounded-lg mx-auto" />
              <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto" />
              <div className="h-16 bg-gray-100 rounded" />
            </div>
          )}

          {!loading && error && <div className="text-sm text-red-600 py-4 text-center">{error}</div>}

          {!loading && definition && (
            <>
              <div className="flex flex-col items-center text-center mb-4">
                <div className="relative w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden mb-3">
                  {showImage ? (
                    isOptimizableImageUrl(imageSrc) ? (
                      <Image src={imageSrc} alt={definition.title} fill className="object-contain p-2" sizes="80px" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageSrc} alt={definition.title} className="w-full h-full object-contain p-2" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{definition.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{definition.description}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRarityStyle(definition.rarity)}`}>{definition.rarity}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(definition.status)}`}>{definition.status}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">{definition.category}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg px-3">
                {definition.unlock_hint && <DetailRow label="Unlock Hint" value={definition.unlock_hint} />}
                <DetailRow label="XP Reward" value={<span className="font-semibold text-amber-600">+{definition.xp_reward} XP</span>} />
                <DetailRow label="Visibility" value={definition.visibility} />
                <DetailRow label="Rule Type" value={definition.rule_type} />
                {definition.rule_config?.event_type && (
                  <DetailRow
                    label="Rule Target"
                    value={`${definition.rule_config.event_type} × ${definition.rule_config.target}${definition.rule_config.place_category ? ` (${definition.rule_config.place_category})` : ""}`}
                  />
                )}
                <DetailRow label="Retroactive" value={definition.retroactive_enabled ? "Yes" : "No"} />
                {assignedAt && (
                  <DetailRow label="Assigned On" value={new Date(assignedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <DeleteDialog
        isOpen={isConfirmingRemove}
        onClose={() => setIsConfirmingRemove(false)}
        onConfirm={handleConfirmRemove}
        title="Remove Badge"
        message="Are you sure you want to remove this achievement from the user? They will no longer have it."
        itemName={definition?.title}
        isDeleting={isRemoving}
      />
    </div>
  );
}
