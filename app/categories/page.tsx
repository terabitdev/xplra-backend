'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Category } from '@/lib/domain/models/category';
import DashboardLayout from '../components/DashboardLayout';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCategories, deleteCategory } from '../store/slices/categoriesSlice';
import CategoryFormModal from '../components/modals/CategoryFormModal';
import DeleteDialog from '../components/ui/DeleteDialog';
import Toaster from '../components/ui/Toaster';
import Image from 'next/image';
import { useSearch } from '../contexts/SearchContext';

export default function CategoriesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [adminId, setAdminId] = useState<string>('');
    const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', isVisible: false });
    const dispatch = useAppDispatch();
    const { searchQuery } = useSearch();

    // Get categories from Redux store
    const { categories, loading, error } = useAppSelector((state) => state.categories);
    const { uid } = useAppSelector((state) => state.user);

    // Filter categories based on search query
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories;

        const query = searchQuery.toLowerCase();
        return categories.filter(category =>
            category.name.toLowerCase().includes(query)
        );
    }, [categories, searchQuery]);

    // Set admin ID from user uid
    useEffect(() => {
        if (uid) {
            setAdminId(uid);
        }
    }, [uid]);

    // Fetch categories using Redux on mount
    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    // Open delete dialog
    const handleDeleteClick = useCallback((category: Category) => {
        setCategoryToDelete(category);
        setIsDeleteDialogOpen(true);
    }, []);

    // Confirm delete category
    const handleConfirmDelete = async () => {
        if (!categoryToDelete) return;

        setIsDeleting(true);
        try {
            await dispatch(deleteCategory(categoryToDelete.id)).unwrap();
            setIsDeleteDialogOpen(false);
            setCategoryToDelete(null);
            setToast({ message: 'Category deleted successfully', type: 'success', isVisible: true });
        } catch (error) {
            console.error('Failed to delete category:', error);
            setToast({ message: 'Failed to delete category. Please try again.', type: 'error', isVisible: true });
        } finally {
            setIsDeleting(false);
        }
    };

    // Cancel delete
    const handleCancelDelete = () => {
        setIsDeleteDialogOpen(false);
        setCategoryToDelete(null);
    };

    // Open edit modal
    const handleEditCategory = useCallback((category: Category) => {
        // Ensure category has userId set to current admin
        const categoryWithUserId = {
            ...category,
            userId: adminId || category.userId
        };
        setSelectedCategory(categoryWithUserId);
        setIsModalOpen(true);
    }, [adminId]);

    // Open create modal
    const handleCreateCategory = useCallback(() => {
        setSelectedCategory(null);
        setIsModalOpen(true);
    }, []);

    // Handle form submission
    const handleSubmitCategory = async (category: Partial<Category>, imageFile: File | null) => {
        try {
            const formData = new FormData();
            formData.append('category', JSON.stringify(category));

            if (imageFile) {
                formData.append('image', imageFile);
            }

            const url = selectedCategory ? `/api/categories/${selectedCategory.id}` : '/api/categories';
            const method = selectedCategory ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                body: formData,
            });

            if (res.ok) {
                // Refresh categories list
                dispatch(fetchCategories());
                setIsModalOpen(false);
                setSelectedCategory(null);
                const message = selectedCategory ? 'Category updated successfully' : 'Category created successfully';
                setToast({ message, type: 'success', isVisible: true });
            } else {
                const errorData = await res.json();
                setToast({ message: errorData.error || 'Failed to save category', type: 'error', isVisible: true });
            }
        } catch (error) {
            console.error('Error submitting category:', error);
            setToast({ message: 'An error occurred while saving the category', type: 'error', isVisible: true });
        }
    };

    return (
        <DashboardLayout>
            <div className="w-full mt-5 sm:mt-7 lg:mt-0  p-2 sm:p-4 lg:py-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Categories Management</h1>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base">Create and manage your categories</p>
                    </div>
                    <button
                        className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                        onClick={handleCreateCategory}
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">Create New Category</span>
                        <span className="sm:hidden">New Category</span>
                    </button>
                </div>

                {/* Search Results Count */}
                {searchQuery && (
                    <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <span className="font-semibold">{filteredCategories.length}</span> {filteredCategories.length === 1 ? 'category' : 'categories'} found for "{searchQuery}"
                        </p>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[60vh]">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-gray-600 mt-4 text-lg font-medium">Loading categories...</p>
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
                    /* Categories Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                        {filteredCategories.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20">
                                <svg className="w-20 h-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <p className="text-gray-600 text-lg font-medium">
                                    {searchQuery ? 'No categories match your search' : 'No categories found'}
                                </p>
                                <p className="text-gray-400 text-sm mt-1">
                                    {searchQuery ? 'Try adjusting your search terms' : 'Create your first category to get started'}
                                </p>
                            </div>
                        ) : (
                            filteredCategories.map((category) => (
                                <div
                                    key={category.id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group"
                                >
                                    {/* Category Image */}
                                    <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                                        {category.imageUrl ? (
                                            <Image
                                                src={category.imageUrl}
                                                alt={category.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-200"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Category Info */}
                                    <div className="p-4">
                                        <h3 className="text-lg font-semibold text-gray-900 truncate mb-3">
                                            {category.name}
                                        </h3>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors duration-150 font-medium flex items-center justify-center gap-1"
                                                onClick={() => handleEditCategory(category)}
                                                title="Edit category"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Edit
                                            </button>
                                            <button
                                                className="px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors duration-150 font-medium flex items-center justify-center"
                                                onClick={() => handleDeleteClick(category)}
                                                title="Delete category"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Category Form Modal */}
            <CategoryFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedCategory(null);
                }}
                onSubmit={handleSubmitCategory}
                category={selectedCategory}
                adminId={adminId}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Delete Category"
                message="Are you sure you want to delete this category? This action cannot be undone and may affect adventures and quests using this category."
                itemName={categoryToDelete?.name}
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
