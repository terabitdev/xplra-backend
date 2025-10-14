"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Category } from "@/lib/domain/models/category";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchQuests, deleteQuest } from "../store/slices/questsSlice";
import QuestFormModal from "../components/modals/QuestFormModal";
import DeleteDialog from "../components/ui/DeleteDialog";
import Toaster from "../components/ui/Toaster";
import { Quest } from "@/lib/domain/models/quest";
import SearchBar from "../components/SearchBar";
import QuestsFilter from "../components/filters/QuestsFilter";
import { useSearch } from "../contexts/SearchContext";

export default function QuestsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [adminId, setAdminId] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [questToDelete, setQuestToDelete] = useState<Quest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', isVisible: false });
  const dispatch = useAppDispatch();
  const { searchQuery } = useSearch();

  // Get quests from Redux store
  const { quests, loading, error } = useAppSelector((state) => state.quests);
  const { uid } = useAppSelector((state) => state.user);
  const { selectedCategory } = useAppSelector((state) => state.filter);

  // Filter quests based on search query and category
  const filteredQuests = useMemo(() => {
    let filtered = quests;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((quest) => quest.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (quest) =>
          quest.title.toLowerCase().includes(query) ||
          quest.shortDescription.toLowerCase().includes(query) ||
          quest.stepType.toLowerCase().includes(query) ||
          categories
            ?.find((cat: Category) => cat.id === quest.category)
            ?.name.toLowerCase()
            .includes(query)
      );
    }

    return filtered;
  }, [quests, searchQuery, categories, selectedCategory]);

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    };

    fetchCategories();
  }, []);

  // Set admin ID from user uid
  useEffect(() => {
    if (uid) {
      setAdminId(uid);
    }
  }, [uid]);

  // Fetch quests using Redux on mount
  useEffect(() => {
    dispatch(fetchQuests());
  }, [dispatch]);

  // Open delete dialog
  const handleDeleteClick = useCallback((quest: Quest) => {
    setQuestToDelete(quest);
    setIsDeleteDialogOpen(true);
  }, []);

  // Confirm delete quest
  const handleConfirmDelete = async () => {
    if (!questToDelete) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteQuest(questToDelete.id)).unwrap();
      setIsDeleteDialogOpen(false);
      setQuestToDelete(null);
      setToast({ message: 'Quest deleted successfully', type: 'success', isVisible: true });
    } catch (error) {
      console.error("Failed to delete quest:", error);
      setToast({ message: 'Failed to delete quest. Please try again.', type: 'error', isVisible: true });
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setQuestToDelete(null);
  };

  // Open edit modal
  const handleEditQuest = useCallback(
    (quest: Quest) => {
      // Ensure quest has userId set to current admin
      const questWithUserId = {
        ...quest,
        userId: adminId || quest.userId,
      };
      setSelectedQuest(questWithUserId);
      setIsModalOpen(true);
    },
    [adminId]
  );

  // Open create modal
  const handleCreateQuest = useCallback(() => {
    setSelectedQuest(null);
    setIsModalOpen(true);
  }, []);

  // Handle form submission
  const handleSubmitQuest = async (
    quest: Partial<Quest>,
    imageFile: File | null
  ) => {
    try {
      const formData = new FormData();
      formData.append("quest", JSON.stringify(quest));
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const url = selectedQuest
        ? `/api/quests/${selectedQuest.id}`
        : "/api/quests/create";
      const method = selectedQuest ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (res.ok) {
        // Refresh quests list
        dispatch(fetchQuests());
        setIsModalOpen(false);
        setSelectedQuest(null);
        const message = selectedQuest ? 'Quest updated successfully' : 'Quest created successfully';
        setToast({ message, type: 'success', isVisible: true });
      } else {
        const errorData = await res.json();
        setToast({ message: errorData.error || 'Failed to save quest', type: 'error', isVisible: true });
      }
    } catch (error) {
      console.error("Error submitting quest:", error);
      setToast({ message: 'An error occurred while saving the quest', type: 'error', isVisible: true });
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full p-2 mt-3 sm:mt-7 lg:mt-0 sm:p-4 lg:py-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Quests Management
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Create and manage your quests</p>
          </div>
          <button
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
            onClick={handleCreateQuest}
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="hidden sm:inline">Create New Quest</span>
            <span className="sm:hidden">New Quest</span>
          </button>
        </div>

        {/* Filter Section */}
        <QuestsFilter categories={categories} />

        {/* Search/Filter Results Count */}
        {(searchQuery || selectedCategory) && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">{filteredQuests.length}</span>{" "}
              {filteredQuests.length === 1 ? "quest" : "quests"} found
              {searchQuery && ` for "${searchQuery}"`}
              {selectedCategory &&
                ` in ${
                  categories?.find((cat: Category) => cat.id === selectedCategory)
                    ?.name || "selected category"
                }`}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 mt-4 text-lg font-medium">
              Loading quests...
            </p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <svg
              className="w-6 h-6 text-red-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-800 font-medium">Error: {error}</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-4">
              {filteredQuests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                  <svg
                    className="w-16 h-16 text-gray-300 mb-4 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-gray-600 text-lg font-medium">No quests found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {quests.length === 0
                      ? "Create your first quest to get started"
                      : "No quests match your filters"}
                  </p>
                </div>
              ) : (
                filteredQuests.map((quest) => (
                  <div
                    key={quest.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Quest Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <img
                        src={quest.imageUrl}
                        alt={quest.title}
                        className="w-16 h-16 rounded-lg object-cover shadow-sm border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{quest.title}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2">{quest.shortDescription}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          {categories?.find((cat: Category) => cat.id === quest.category)?.name || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Quest Details Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div className="flex items-center gap-1 text-gray-700">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-semibold">{quest.experience} XP</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-700">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span>{quest.distance ? `${quest.distance}m` : "-"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-700">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{quest.timeInSeconds ? `${Math.floor(quest.timeInSeconds / 60)}m` : "-"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-700">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                          {quest.stepType}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        className="flex-1 py-2 px-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                        onClick={() => handleEditQuest(quest)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        className="flex-1 py-2 px-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                        onClick={() => handleDeleteClick(quest)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[200px]">
                      Quest
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                      Category
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      XP
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Cooldown
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-[120px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredQuests.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg
                            className="w-16 h-16 text-gray-300 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <p className="text-gray-600 text-lg font-medium">
                            No quests found
                          </p>
                          <p className="text-gray-400 text-sm mt-1">
                            {quests.length === 0
                              ? "Create your first quest to get started"
                              : "No quests match your filters"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredQuests.map((quest) => (
                      <tr
                        key={quest.id}
                        className="hover:bg-blue-50 transition-colors duration-150"
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2 max-w-[200px]">
                            <img
                              src={quest.imageUrl}
                              alt={quest.title}
                              className="w-9 h-9 rounded-lg object-cover shadow-sm border border-gray-200 flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {quest.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {quest.shortDescription}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {categories?.find(
                              (category: Category) =>
                                category.id === quest.category
                            )?.name || "N/A"}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs font-semibold text-gray-900">
                              {quest.experience}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-xs text-gray-700">
                            <svg
                              className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span className="font-medium">
                              {quest.distance ? `${quest.distance}m` : "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-xs text-gray-700">
                            <svg
                              className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="font-medium">
                              {quest.timeInSeconds
                                ? `${Math.floor(quest.timeInSeconds / 60)}m`
                                : "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-xs text-gray-700">
                            <svg
                              className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            <span className="font-medium">
                              {quest.hoursToCompleteAgain
                                ? `${quest.hoursToCompleteAgain}h`
                                : "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-[10px] text-gray-600 space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-gray-500">
                                Lat:
                              </span>
                              <span>
                                {(quest.stepLatitude as number).toFixed(3)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-gray-500">
                                Lng:
                              </span>
                              <span>
                                {(quest.stepLongitude as number).toFixed(3)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                            {quest.stepType}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-150"
                              onClick={() => handleEditQuest(quest)}
                              title="Edit quest"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-150"
                              onClick={() => handleDeleteClick(quest)}
                              title="Delete quest"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}
      </div>

      {/* Quest Form Modal */}
      <QuestFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedQuest(null);
        }}
        onSubmit={handleSubmitQuest}
        quest={selectedQuest}
        categories={categories}
        adminId={adminId}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Quest"
        message="Are you sure you want to delete this quest? This action cannot be undone and all associated data will be permanently removed."
        itemName={questToDelete?.title}
        isDeleting={isDeleting}
      />

      {/* Toaster */}
      <Toaster
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </DashboardLayout>
  );
}
