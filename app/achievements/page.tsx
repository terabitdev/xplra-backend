'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Achievement } from '@/lib/domain/models/achievement';
import DashboardLayout from '../components/DashboardLayout';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAchievements, deleteAchievement } from '../store/slices/achievementsSlice';
import AchievementFormModal from '../components/modals/AchievementFormModal';
import DeleteDialog from '../components/ui/DeleteDialog';
import Toaster from '../components/ui/Toaster';
import { useSearch } from '../contexts/SearchContext';
import AchievementsFilter from '../components/filters/AchievementsFilter';

export default function AchievementsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [achievementToDelete, setAchievementToDelete] = useState<Achievement | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [adminId, setAdminId] = useState<string>('');
    const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', isVisible: false });
    const dispatch = useAppDispatch();
    const { searchQuery } = useSearch();
    const { selectedTriggerType } = useAppSelector((state) => state.filter);

    // Get achievements from Redux store
    const { achievements, loading, error } = useAppSelector((state) => state.achievements);
    const { uid } = useAppSelector((state) => state.user);

    // Filter achievements based on trigger type filter and search query
    const filteredAchievements = useMemo(() => {
        let filtered = achievements;

        // Apply trigger type filter
        if (selectedTriggerType) {
            filtered = filtered.filter(achievement => achievement.trigger === selectedTriggerType);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(achievement =>
                achievement.title.toLowerCase().includes(query) ||
                achievement.description.toLowerCase().includes(query) ||
                achievement.trigger.toLowerCase().includes(query) ||
                achievement.triggerValue.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [achievements, searchQuery, selectedTriggerType]);

    // Set admin ID from user uid
    useEffect(() => {
        if (uid) {
            setAdminId(uid);
        }
    }, [uid]);

    // Fetch achievements using Redux on mount
    useEffect(() => {
        dispatch(fetchAchievements());
    }, [dispatch]);

    // Open delete dialog
    const handleDeleteClick = useCallback((achievement: Achievement) => {
        setAchievementToDelete(achievement);
        setIsDeleteDialogOpen(true);
    }, []);

    // Confirm delete achievement
    const handleConfirmDelete = async () => {
        if (!achievementToDelete) return;

        setIsDeleting(true);
        try {
            await dispatch(deleteAchievement(achievementToDelete.id)).unwrap();
            setIsDeleteDialogOpen(false);
            setAchievementToDelete(null);
            setToast({ message: 'Achievement deleted successfully', type: 'success', isVisible: true });
        } catch (error) {
            console.error('Failed to delete achievement:', error);
            setToast({ message: 'Failed to delete achievement. Please try again.', type: 'error', isVisible: true });
        } finally {
            setIsDeleting(false);
        }
    };

    // Cancel delete
    const handleCancelDelete = () => {
        setIsDeleteDialogOpen(false);
        setAchievementToDelete(null);
    };

    // Open edit modal
    const handleEditAchievement = useCallback((achievement: Achievement) => {
        // Ensure achievement has userId set to current admin
        const achievementWithUserId = {
            ...achievement,
            userId: adminId || achievement.userId
        };
        setSelectedAchievement(achievementWithUserId);
        setIsModalOpen(true);
    }, [adminId]);

    // Open create modal
    const handleCreateAchievement = useCallback(() => {
        setSelectedAchievement(null);
        setIsModalOpen(true);
    }, []);

    // Handle form submission
    const handleSubmitAchievement = async (achievement: Partial<Achievement>) => {
        try {
            const formData = new FormData();
            formData.append('achievement', JSON.stringify(achievement));

            const url = selectedAchievement ? `/api/achievements/${selectedAchievement.id}` : '/api/achievements';
            const method = selectedAchievement ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                body: formData,
            });

            if (res.ok) {
                // Refresh achievements list
                dispatch(fetchAchievements());
                setIsModalOpen(false);
                setSelectedAchievement(null);
                const message = selectedAchievement ? 'Achievement updated successfully' : 'Achievement created successfully';
                setToast({ message, type: 'success', isVisible: true });
            } else {
                const errorData = await res.json();
                setToast({ message: errorData.error || 'Failed to save achievement', type: 'error', isVisible: true });
            }
        } catch (error) {
            console.error('Error submitting achievement:', error);
            setToast({ message: 'An error occurred while saving the achievement', type: 'error', isVisible: true });
        }
    };

    const getTriggerIcon = (trigger: string) => {
        switch (trigger) {
            case 'experience':
                return '⭐';
            case 'level':
                return '📈';
            case 'achievement':
                return '🏅';
            case 'quest':
                return '🎯';
            default:
                return '📌';
        }
    };

    return (
        <DashboardLayout>
            <div className="w-full p-2 mt-5 sm:mt-7 lg:mt-0  sm:p-4 lg:py-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Achievements Management</h1>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base">Create and manage your achievements</p>
                    </div>
                    <button
                        className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                        onClick={handleCreateAchievement}
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">Create New Achievement</span>
                        <span className="sm:hidden">New Achievement</span>
                    </button>
                </div>

                {/* Trigger Type Filter */}
                <AchievementsFilter />

                {/* Search/Filter Results Count */}
                {(searchQuery || selectedTriggerType) && (
                    <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <span className="font-semibold">{filteredAchievements.length}</span> {filteredAchievements.length === 1 ? 'achievement' : 'achievements'} found
                            {searchQuery && ` for "${searchQuery}"`}
                            {selectedTriggerType && ` with trigger type "${selectedTriggerType}"`}
                        </p>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[60vh]">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-gray-600 mt-4 text-lg font-medium">Loading achievements...</p>
                    </div>
                ) : error ? (
                    /* Error State */
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                        <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-800 font-medium">Error: {error}</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="block lg:hidden space-y-4">
                            {filteredAchievements.length === 0 ? (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                                    <svg className="w-16 h-16 text-gray-300 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                    <p className="text-gray-600 text-lg font-medium">
                                        {searchQuery ? 'No achievements match your search' : 'No achievements found'}
                                    </p>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {searchQuery ? 'Try adjusting your search terms' : 'Create your first achievement to get started'}
                                    </p>
                                </div>
                            ) : (
                                filteredAchievements.map((achievement) => (
                                    <div key={achievement.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                                        {/* Header */}
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-200 flex items-center justify-center text-2xl shadow-sm border border-yellow-200">
                                                {achievement.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">{achievement.title}</h3>
                                                <p className="text-xs text-gray-500 line-clamp-2">{achievement.description}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-base">{getTriggerIcon(achievement.trigger)}</span>
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                                                        {achievement.trigger}
                                                    </span>
                                                    <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-800">
                                                        {achievement.triggerValue}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                                            <button
                                                className="flex-1 py-2 px-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                                                onClick={() => handleEditAchievement(achievement)}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Edit
                                            </button>
                                            <button
                                                className="flex-1 py-2 px-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                                                onClick={() => handleDeleteClick(achievement)}
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
                                            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Icon</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[250px]">Achievement</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Trigger Type</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Trigger Value</th>
                                            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-[120px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredAchievements.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                        </svg>
                                                        <p className="text-gray-600 text-lg font-medium">
                                                            {searchQuery ? 'No achievements match your search' : 'No achievements found'}
                                                        </p>
                                                        <p className="text-gray-400 text-sm mt-1">
                                                            {searchQuery ? 'Try adjusting your search terms' : 'Create your first achievement to get started'}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAchievements.map((achievement) => (
                                                <tr key={achievement.id} className="hover:bg-blue-50 transition-colors duration-150">
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center justify-center">
                                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-200 flex items-center justify-center text-2xl shadow-sm">
                                                                {achievement.icon}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="max-w-[250px]">
                                                            <p className="text-sm font-semibold text-gray-900 truncate">{achievement.title}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{achievement.description}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">{getTriggerIcon(achievement.trigger)}</span>
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                                                                {achievement.trigger}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <span className="text-sm font-semibold text-gray-900">{achievement.triggerValue}</span>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-150"
                                                                onClick={() => handleEditAchievement(achievement)}
                                                                title="Edit achievement"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-150"
                                                                onClick={() => handleDeleteClick(achievement)}
                                                                title="Delete achievement"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

            {/* Achievement Form Modal */}
            <AchievementFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedAchievement(null);
                }}
                onSubmit={handleSubmitAchievement}
                achievement={selectedAchievement}
                adminId={adminId}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Delete Achievement"
                message="Are you sure you want to delete this achievement? This action cannot be undone and users will no longer be able to earn this achievement."
                itemName={achievementToDelete?.title}
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
