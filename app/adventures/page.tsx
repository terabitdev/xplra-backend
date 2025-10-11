'use client';

import { useEffect, useState, useCallback } from 'react';
import { Adventure } from '@/lib/domain/models/adventures';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { Category } from '@/lib/domain/models/category';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAdventures, deleteAdventure } from '../store/slices/adventuresSlice';
import AdventureFormModal from '../components/modals/AdventureFormModal';
import DeleteDialog from '../components/ui/DeleteDialog';
import Image from 'next/image';

export default function AdventuresPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);
    const [adminId, setAdminId] = useState<string>('');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [adventureToDelete, setAdventureToDelete] = useState<Adventure | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Get adventures from Redux store
    const { adventures, loading, error } = useAppSelector((state) => state.adventures);
    const { uid } = useAppSelector((state) => state.user);

    useEffect(() => {
        const fetchCategories = async () => {
            const res = await fetch('/api/categories');
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

    // Fetch adventures using Redux on mount
    useEffect(() => {
        dispatch(fetchAdventures());
    }, [dispatch]);

    // Open delete dialog
    const handleDeleteClick = useCallback((adventure: Adventure) => {
        setAdventureToDelete(adventure);
        setIsDeleteDialogOpen(true);
    }, []);

    // Confirm delete adventure
    const handleConfirmDelete = async () => {
        if (!adventureToDelete) return;

        setIsDeleting(true);
        try {
            await dispatch(deleteAdventure(adventureToDelete.id)).unwrap();
            setIsDeleteDialogOpen(false);
            setAdventureToDelete(null);
        } catch (error) {
            console.error('Failed to delete adventure:', error);
            alert('Failed to delete adventure. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Cancel delete
    const handleCancelDelete = () => {
        setIsDeleteDialogOpen(false);
        setAdventureToDelete(null);
    };

    // Open edit modal
    const handleEditAdventure = useCallback((adventure: Adventure) => {
        // Ensure adventure has userId set to current admin
        const adventureWithUserId = {
            ...adventure,
            userId: adminId || adventure.userId
        };
        setSelectedAdventure(adventureWithUserId);
        setIsModalOpen(true);
    }, [adminId]);

    // Open create modal
    const handleCreateAdventure = useCallback(() => {
        setSelectedAdventure(null);
        setIsModalOpen(true);
    }, []);

    // Handle form submission
    const handleSubmitAdventure = async (adventure: Partial<Adventure>, imageFile: File | null, multiImageFiles: File[]) => {
        try {
            const formData = new FormData();
            formData.append('adventure', JSON.stringify(adventure));

            if (adventure.featured) {
                multiImageFiles.forEach((file) => {
                    formData.append('featuredImages', file);
                });
            } else if (imageFile) {
                formData.append('image', imageFile);
            }

            const url = selectedAdventure ? `/api/adventures/${selectedAdventure.id}` : '/api/adventures';
            const method = selectedAdventure ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                body: formData,
            });

            if (res.ok) {
                // Refresh adventures list
                dispatch(fetchAdventures());
                setIsModalOpen(false);
                setSelectedAdventure(null);
            } else {
                const errorData = await res.json();
                alert(`Error: ${errorData.error || 'Failed to save adventure'}`);
            }
        } catch (error) {
            console.error('Error submitting adventure:', error);
            alert('An error occurred while saving the adventure');
        }
    };

    return (
        <DashboardLayout>
            <div className="w-full p-6">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Adventures Management</h1>
                        <p className="text-gray-600 mt-1">Create and manage your adventures</p>
                    </div>
                    <button
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                        onClick={handleCreateAdventure}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create New Adventure
                    </button>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[60vh]">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-gray-600 mt-4 text-lg font-medium">Loading adventures...</p>
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
                    /* Adventures Table */
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[200px]">Adventure</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Category</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">XP</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Distance</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Time</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Cooldown</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Location</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Featured</th>
                                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-[120px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {adventures.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <p className="text-gray-600 text-lg font-medium">No adventures found</p>
                                                    <p className="text-gray-400 text-sm mt-1">Create your first adventure to get started</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        adventures.map((adventure) => (
                                            <tr key={adventure.id} className="hover:bg-blue-50 transition-colors duration-150">
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center gap-2 max-w-[200px]">
                                                        {(() => {
                                                            // Get image URL from featuredImages array first, then fallback to imageUrl
                                                            const imageUrl = adventure.featuredImages && adventure.featuredImages.length > 0
                                                                ? adventure.featuredImages[0]
                                                                : adventure.imageUrl;

                                                            return imageUrl ? (
                                                                <Image
                                                                    src={imageUrl}
                                                                    alt={adventure.title}
                                                                    width={36}
                                                                    height={36}
                                                                    className="w-9 h-9 rounded-lg object-cover shadow-sm border border-gray-200 flex-shrink-0"
                                                                    unoptimized
                                                                />
                                                            ) : (
                                                                <div className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                </div>
                                                            );
                                                        })()}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-gray-900 truncate">{adventure.title}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5 truncate">{adventure.shortDescription}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {categories?.find((category: Category) => category.id === adventure.category)?.name || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                        <span className="text-xs font-semibold text-gray-900">{adventure.experience}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-1 text-xs text-gray-700">
                                                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span className="font-medium">{adventure.distance ? `${adventure.distance}m` : '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-1 text-xs text-gray-700">
                                                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span className="font-medium">{adventure.timeInSeconds ? `${Math.floor(adventure.timeInSeconds / 60)}m` : '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-1 text-xs text-gray-700">
                                                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                        <span className="font-medium">{adventure.hoursToCompleteAgain ? `${adventure.hoursToCompleteAgain}h` : '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="text-[10px] text-gray-600 space-y-0.5">
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-medium text-gray-500">Lat:</span>
                                                            <span>{(adventure.latitude as number).toFixed(3)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-medium text-gray-500">Lng:</span>
                                                            <span>{(adventure.longitude as number).toFixed(3)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${adventure.featured ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {adventure.featured ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-150"
                                                            onClick={() => handleEditAdventure(adventure)}
                                                            title="Edit adventure"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-150"
                                                            onClick={() => handleDeleteClick(adventure)}
                                                            title="Delete adventure"
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

            {/* Adventure Form Modal */}
            <AdventureFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedAdventure(null);
                }}
                onSubmit={handleSubmitAdventure}
                adventure={selectedAdventure}
                categories={categories}
                adminId={adminId}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Delete Adventure"
                message="Are you sure you want to delete this adventure? This action cannot be undone and all associated data will be permanently removed."
                itemName={adventureToDelete?.title}
                isDeleting={isDeleting}
            />
        </DashboardLayout>
    );
}
