'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Achievement } from '@/lib/domain/models/achievement';
import DashboardLayout from '../components/DashboardLayout';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAchievements, deleteAchievement } from '../store/slices/achievementsSlice';
import AchievementFormModal from '../components/modals/AchievementFormModal';
import DeleteDialog from '../components/ui/DeleteDialog';
import { useSearch } from '../contexts/SearchContext';

export default function AchievementsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [achievementToDelete, setAchievementToDelete] = useState<Achievement | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [adminId, setAdminId] = useState<string>('');
    const dispatch = useAppDispatch();
    const { searchQuery } = useSearch();

    // Get achievements from Redux store
    const { achievements, loading, error } = useAppSelector((state) => state.achievements);
    const { uid } = useAppSelector((state) => state.user);

    // Filter achievements based on search query
    const filteredAchievements = useMemo(() => {
        if (!searchQuery.trim()) return achievements;

        const query = searchQuery.toLowerCase();
        return achievements.filter(achievement =>
            achievement.title.toLowerCase().includes(query) ||
            achievement.description.toLowerCase().includes(query) ||
            achievement.trigger.toLowerCase().includes(query) ||
            achievement.triggerValue.toLowerCase().includes(query)
        );
    }, [achievements, searchQuery]);

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
        } catch (error) {
            console.error('Failed to delete achievement:', error);
            alert('Failed to delete achievement. Please try again.');
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
            } else {
                const errorData = await res.json();
                alert(`Error: ${errorData.error || 'Failed to save achievement'}`);
            }
        } catch (error) {
            console.error('Error submitting achievement:', error);
            alert('An error occurred while saving the achievement');
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
            <div className="w-full p-6">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Achievements Management</h1>
                        <p className="text-gray-600 mt-1">Create and manage your achievements</p>
                    </div>
                    <button
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                        onClick={handleCreateAchievement}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create New Achievement
                    </button>
                </div>

                {/* Search Results Count */}
                {searchQuery && (
                    <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <span className="font-semibold">{filteredAchievements.length}</span> {filteredAchievements.length === 1 ? 'achievement' : 'achievements'} found for "{searchQuery}"
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
                    /* Achievements Table */
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
        </DashboardLayout>
    );
}
