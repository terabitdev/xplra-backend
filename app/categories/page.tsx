'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Category, CategoryTreeNode, buildCategoryTree } from '@/lib/domain/models/category';
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
    const [parentCategory, setParentCategory] = useState<Category | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', isVisible: false });
    const dispatch = useAppDispatch();
    const { searchQuery } = useSearch();

    const { categories, loading, error } = useAppSelector((state) => state.categories);

    // Filter categories based on search
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories;
        const query = searchQuery.toLowerCase();
        return categories.filter(cat =>
            cat.name.toLowerCase().includes(query) ||
            cat.interestName?.toLowerCase().includes(query)
        );
    }, [categories, searchQuery]);

    // Build tree from filtered categories
    const categoryTree = useMemo(() => {
        if (searchQuery.trim()) {
            // When searching, show flat filtered results
            return filteredCategories.map(cat => ({ ...cat, children: [] as CategoryTreeNode[] }));
        }
        return buildCategoryTree(filteredCategories);
    }, [filteredCategories, searchQuery]);

    useEffect(() => {
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

    const toggleExpand = useCallback((id: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const handleCreateCategory = useCallback(() => {
        setSelectedCategory(null);
        setParentCategory(null);
        setIsModalOpen(true);
    }, []);

    const handleCreateSubcategory = useCallback((parent: Category) => {
        setSelectedCategory(null);
        setParentCategory(parent);
        setIsModalOpen(true);
    }, []);

    const handleEditCategory = useCallback((category: Category) => {
        setSelectedCategory(category);
        setParentCategory(null);
        setIsModalOpen(true);
    }, []);

    const handleDeleteClick = useCallback((category: Category) => {
        setCategoryToDelete(category);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleConfirmDelete = async () => {
        if (!categoryToDelete) return;
        setIsDeleting(true);
        try {
            await dispatch(deleteCategory(categoryToDelete.id)).unwrap();
            setIsDeleteDialogOpen(false);
            setCategoryToDelete(null);
            setToast({ message: 'Category deleted successfully', type: 'success', isVisible: true });
        } catch (error: any) {
            const msg = error?.toString() || 'Failed to delete category';
            setToast({ message: msg, type: 'error', isVisible: true });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteDialogOpen(false);
        setCategoryToDelete(null);
    };

    const handleSubmitCategory = async (categoryData: Partial<Category>, iconFile?: File) => {
        try {
            const formData = new FormData();
            formData.append('category', JSON.stringify(categoryData));
            if (iconFile) {
                formData.append('icon', iconFile);
            }

            const url = selectedCategory ? `/api/categories/${selectedCategory.id}` : '/api/categories';
            const method = selectedCategory ? 'PATCH' : 'POST';

            const res = await fetch(url, { method, body: formData });

            if (res.ok) {
                dispatch(fetchCategories({ fresh: true }));
                setIsModalOpen(false);
                setSelectedCategory(null);
                setParentCategory(null);
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

    // Recursive tree row renderer for desktop
    const renderTreeRow = (node: CategoryTreeNode, depth: number = 0): React.ReactNode => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);
        const childCount = categories.filter(c => c.parentId === node.id).length;

        return (
            <tbody key={node.id}>
                <tr className="hover:bg-blue-50 transition-colors duration-150">
                    <td className="px-3 py-3">
                        <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
                            {hasChildren ? (
                                <button
                                    onClick={() => toggleExpand(node.id)}
                                    className="p-0.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                                >
                                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ) : (
                                <span className="w-5 flex-shrink-0" />
                            )}
                            {node.icon ? (
                                <Image
                                    src={node.icon}
                                    alt={node.name}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-lg object-contain border border-gray-200 bg-gray-50 flex-shrink-0"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900 truncate">{node.name}</p>
                                {node.interestName && node.interestName !== node.name && (
                                    <p className="text-xs text-gray-500 truncate">{node.interestName}</p>
                                )}
                            </div>
                        </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            Level {node.level}
                        </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-700">
                        {childCount > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {childCount} {childCount === 1 ? 'child' : 'children'}
                            </span>
                        ) : (
                            <span className="text-gray-400">-</span>
                        )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${node.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {node.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${node.isVisibleInInterests ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                            {node.isVisibleInInterests ? 'Yes' : 'No'}
                        </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-700">
                        <div className="flex gap-3">
                            <span title="Interests Order">I: {node.interestsOrder}</span>
                            <span title="Place Order">P: {node.placeOrder}</span>
                        </div>
                    </td>
                    <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                            <button
                                className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                onClick={() => handleCreateSubcategory(node)}
                                title="Add subcategory"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                            <button
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                onClick={() => handleEditCategory(node)}
                                title="Edit category"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                onClick={() => handleDeleteClick(node)}
                                title="Delete category"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
                {isExpanded && node.children.map(child => renderTreeRow(child, depth + 1))}
            </tbody>
        );
    };

    // Recursive tree card renderer for mobile
    const renderTreeCard = (node: CategoryTreeNode, depth: number = 0): React.ReactNode => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);
        const childCount = categories.filter(c => c.parentId === node.id).length;

        return (
            <div key={node.id} style={{ marginLeft: `${depth * 16}px` }}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3 mb-3">
                        {node.icon ? (
                            <Image
                                src={node.icon}
                                alt={node.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-lg object-contain border border-gray-200 bg-gray-50"
                                unoptimized
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{node.name}</h3>
                            {node.interestName && node.interestName !== node.name && (
                                <p className="text-xs text-gray-500 truncate">{node.interestName}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                    Level {node.level}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${node.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {node.isActive ? 'Active' : 'Inactive'}
                                </span>
                                {node.isVisibleInInterests && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        Interest
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                        <div className="text-gray-600">
                            <span className="font-medium text-gray-500">Children:</span> {childCount}
                        </div>
                        <div className="text-gray-600">
                            <span className="font-medium text-gray-500">I-Order:</span> {node.interestsOrder}
                        </div>
                        <div className="text-gray-600">
                            <span className="font-medium text-gray-500">P-Order:</span> {node.placeOrder}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                        {hasChildren && (
                            <button
                                className="py-2 px-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
                                onClick={() => toggleExpand(node.id)}
                            >
                                <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                {isExpanded ? 'Collapse' : `Expand (${childCount})`}
                            </button>
                        )}
                        <button
                            className="py-2 px-3 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
                            onClick={() => handleCreateSubcategory(node)}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Sub
                        </button>
                        <button
                            className="py-2 px-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
                            onClick={() => handleEditCategory(node)}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </button>
                        <button
                            className="py-2 px-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
                            onClick={() => handleDeleteClick(node)}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>

                {isExpanded && hasChildren && (
                    <div className="mt-2 space-y-2">
                        {node.children.map(child => renderTreeCard(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="w-full p-2 mt-5 sm:mt-7 lg:mt-0 sm:p-4 lg:py-6">
                {/* Header */}
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
                            <span className="font-semibold">{filteredCategories.length}</span> {filteredCategories.length === 1 ? 'category' : 'categories'} found
                            {searchQuery && ` for "${searchQuery}"`}
                        </p>
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[60vh]">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-gray-600 mt-4 text-lg font-medium">Loading categories...</p>
                    </div>
                ) : error ? (
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
                            {categoryTree.length === 0 ? (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                                    <svg className="w-16 h-16 text-gray-300 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                categoryTree.map(node => renderTreeCard(node))
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Level</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Children</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Interests</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order</th>
                                            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-[140px]">Actions</th>
                                        </tr>
                                    </thead>
                                    {categoryTree.length === 0 ? (
                                        <tbody>
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                        </svg>
                                                        <p className="text-gray-600 text-lg font-medium">
                                                            {searchQuery ? 'No categories match your search' : 'No categories found'}
                                                        </p>
                                                        <p className="text-gray-400 text-sm mt-1">
                                                            {searchQuery ? 'Try adjusting your search terms' : 'Create your first category to get started'}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    ) : (
                                        categoryTree.map(node => renderTreeRow(node))
                                    )}
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Category Form Modal */}
            <CategoryFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedCategory(null);
                    setParentCategory(null);
                }}
                onSubmit={handleSubmitCategory}
                category={selectedCategory}
                parentCategory={parentCategory}
                allCategories={categories}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Delete Category"
                message="Are you sure you want to delete this category? This action cannot be undone. Categories with children cannot be deleted."
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
