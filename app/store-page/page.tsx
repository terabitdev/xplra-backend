"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchStoreItems, deleteStoreItem } from "../store/slices/storeSlice";
import StoreFormModal from "../components/modals/StoreFormModal";
import DeleteDialog from "../components/ui/DeleteDialog";
import Toaster from "../components/ui/Toaster";
import StoreFilter from "../components/filters/StoreFilter";
import { StoreItem } from "@/lib/domain/models/storeItem";
import { useSearch } from "../contexts/SearchContext";
import Image from "next/image";

export default function StorePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [adminId, setAdminId] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<StoreItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState<boolean | null>(null);
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', isVisible: false });
  const dispatch = useAppDispatch();
  const { searchQuery } = useSearch();

  // Get store items from Redux store
  const { items, loading, error } = useAppSelector((state) => state.store);
  const { uid } = useAppSelector((state) => state.user);

  // Filter items based on search query and availability
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filter by availability
    if (selectedAvailability !== null) {
      filtered = filtered.filter((item) => item.isAvailable === selectedAvailability);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [items, searchQuery, selectedAvailability]);

  // Set admin ID from user uid
  useEffect(() => {
    if (uid) {
      setAdminId(uid);
    }
  }, [uid]);

  // Fetch store items using Redux on mount
  useEffect(() => {
    dispatch(fetchStoreItems());
  }, [dispatch]);

  // Open delete dialog
  const handleDeleteClick = useCallback((item: StoreItem) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  }, []);

  // Confirm delete item
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteStoreItem(itemToDelete.id)).unwrap();
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      setToast({ message: 'Item deleted successfully', type: 'success', isVisible: true });
    } catch (error) {
      console.error("Failed to delete item:", error);
      setToast({ message: 'Failed to delete item. Please try again.', type: 'error', isVisible: true });
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Open edit modal
  const handleEditItem = useCallback(
    (item: StoreItem) => {
      const itemWithUserId = {
        ...item,
        userId: adminId || item.userId,
      };
      setSelectedItem(itemWithUserId);
      setIsModalOpen(true);
    },
    [adminId]
  );

  // Open create modal
  const handleCreateItem = useCallback(() => {
    setSelectedItem(null);
    setIsModalOpen(true);
  }, []);

  // Handle form submission
  const handleSubmitItem = async (item: Partial<StoreItem>, imageFile: File | null) => {
    try {
      const formData = new FormData();
      formData.append("item", JSON.stringify(item));
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const url = selectedItem
        ? `/api/store/${selectedItem.id}`
        : "/api/store/create";
      const method = selectedItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (res.ok) {
        // Refresh items list
        dispatch(fetchStoreItems());
        setIsModalOpen(false);
        setSelectedItem(null);
        const message = selectedItem ? 'Item updated successfully' : 'Item created successfully';
        setToast({ message, type: 'success', isVisible: true });
      } else {
        const errorData = await res.json();
        setToast({ message: errorData.error || 'Failed to save item', type: 'error', isVisible: true });
      }
    } catch (error) {
      console.error("Error submitting item:", error);
      setToast({ message: 'An error occurred while saving the item', type: 'error', isVisible: true });
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full p-2 mt-3 sm:mt-7 lg:mt-0 sm:p-4 lg:py-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Store Management
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your store items</p>
          </div>
          <button
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
            onClick={handleCreateItem}
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
            <span className="hidden sm:inline">Add New Item</span>
            <span className="sm:hidden">New Item</span>
          </button>
        </div>

        {/* Filter Section */}
        <StoreFilter
          selectedAvailability={selectedAvailability}
          onAvailabilityChange={setSelectedAvailability}
        />

        {/* Search/Filter Results Count */}
        {(searchQuery || selectedAvailability !== null) && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">{filteredItems.length}</span>{" "}
              {filteredItems.length === 1 ? "item" : "items"} found
              {searchQuery && ` for "${searchQuery}"`}
              {selectedAvailability !== null &&
                ` (${selectedAvailability ? 'Available' : 'Unavailable'} only)`}
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
              Loading store items...
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
            {/* Grid View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredItems.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
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
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <p className="text-gray-600 text-lg font-medium">No items found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {items.length === 0
                      ? "Add your first item to get started"
                      : "No items match your search"}
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200"
                  >
                    {/* Item Image */}
                    <div className="relative h-48 bg-gray-100">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                      {/* Availability Badge */}
                      <div className="absolute top-2 right-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-lg mb-2 truncate">
                        {item.title}
                      </h3>

                      {/* XP Cost */}
                      <div className="flex items-center gap-2 mb-3">
                        <svg
                          className="w-5 h-5 text-yellow-500 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xl font-bold text-gray-900">{item.xpCost} XP</span>
                      </div>

                      {/* Inventory Count */}
                      {item.inventoryCount !== undefined && (
                        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <span>Stock: {item.inventoryCount}</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button
                          className="flex-1 py-2 px-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                          onClick={() => handleEditItem(item)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          className="flex-1 py-2 px-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                          onClick={() => handleDeleteClick(item)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Store Item Form Modal */}
      <StoreFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }}
        onSubmit={handleSubmitItem}
        item={selectedItem}
        adminId={adminId}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Store Item"
        message="Are you sure you want to delete this item? This action cannot be undone and all associated data will be permanently removed."
        itemName={itemToDelete?.title}
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
