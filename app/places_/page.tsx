"use client";

import { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import DashboardLayout from "../components/DashboardLayout";
import PlaceFormModal, { Place_ } from "../components/modals/PlaceFormModal";
import DeleteDialog from "../components/ui/DeleteDialog";
import Toaster from "../components/ui/Toaster";
import Pagination from "../components/ui/Pagination";
import CardSkeleton from "../components/ui/CardSkeleton";
import TableSkeleton from "../components/ui/TableSkeleton";
import { AppDispatch, RootState } from "../store";
import {
  fetchPlaces,
  createPlace,
  updatePlace,
  deletePlace,
  clearError,
} from "../store/slices/placesSlice";
import { fetchCategories } from "../store/slices/categoriesSlice";

const ITEMS_PER_PAGE = 20;

export default function Places_Page() {
  const dispatch = useDispatch<AppDispatch>();
  const { places, loading, error, pagination, lastFetched } = useSelector(
    (state: RootState) => state.places
  );
  const { categories } = useSelector((state: RootState) => state.categories);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place_ | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [placeToDelete, setPlaceToDelete] = useState<Place_ | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', isVisible: false });
  const [currentPage, setCurrentPage] = useState(1);

  // Check if data is stale (older than 5 minutes)
  const isDataStale = lastFetched ? Date.now() - lastFetched > 5 * 60 * 1000 : true;

  // Fetch data on mount or page change
  useEffect(() => {
    if (places.length === 0 || isDataStale || pagination.page !== currentPage) {
      dispatch(fetchPlaces({ page: currentPage, limit: ITEMS_PER_PAGE }));
    }
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error', isVisible: true });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      hidden: "bg-gray-100 text-gray-600",
      pending: "bg-amber-100 text-amber-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      seed: "bg-blue-100 text-blue-700",
      user_contribution: "bg-violet-100 text-violet-700",
    };
    return colors[source] || "bg-gray-100 text-gray-700";
  };

  const handleCreatePlace = useCallback(() => {
    setSelectedPlace(null);
    setIsModalOpen(true);
  }, []);

  const handleEditPlace = useCallback((place: Place_) => {
    setSelectedPlace(place);
    setIsModalOpen(true);
  }, []);

  const handleSubmitPlace = useCallback(async (place: Place_, imageFiles: File[]) => {
    try {
      if (selectedPlace) {
        await dispatch(updatePlace({ placeData: place, imageFiles })).unwrap();
        setToast({ message: 'Place updated successfully', type: 'success', isVisible: true });
      } else {
        await dispatch(createPlace({ placeData: place, imageFiles })).unwrap();
        setToast({ message: 'Place created successfully', type: 'success', isVisible: true });
      }
      // Refresh places list with fresh data
      await dispatch(fetchPlaces({ page: currentPage, limit: ITEMS_PER_PAGE, fresh: true }));
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : 'An error occurred';
      setToast({ message: errorMessage, type: 'error', isVisible: true });
    }
    setIsModalOpen(false);
    setSelectedPlace(null);
  }, [selectedPlace, dispatch, currentPage]);

  const handleDeleteClick = useCallback((place: Place_) => {
    setPlaceToDelete(place);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!placeToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deletePlace(placeToDelete.placeId)).unwrap();
      setToast({ message: 'Place deleted successfully', type: 'success', isVisible: true });
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : 'Failed to delete place';
      setToast({ message: errorMessage, type: 'error', isVisible: true });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setPlaceToDelete(null);
    }
  }, [placeToDelete, dispatch]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setPlaceToDelete(null);
  }, []);

  // Show initial loading state
  const showInitialLoading = loading && places.length === 0;

  return (
    <DashboardLayout>
      <div className="w-full p-4 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Places</h1>
            <p className="text-gray-500 text-sm">
              Manage physical locations for discovery & quests
              {pagination.total > 0 && (
                <span className="ml-2 text-gray-400">({pagination.total} total)</span>
              )}
            </p>
          </div>
          <button
            onClick={handleCreatePlace}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New Place</span>
          </button>
        </div>

        {showInitialLoading ? (
          <>
            {/* Mobile Skeleton */}
            <div className="lg:hidden">
              <CardSkeleton count={6} showImage={true} />
            </div>
            {/* Desktop Skeleton */}
            <div className="hidden lg:block">
              <TableSkeleton rows={8} columns={8} showImage={true} />
            </div>
          </>
        ) : places.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 py-12 text-center">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-500 font-medium">No places yet</p>
            <p className="text-gray-400 text-sm">Create your first place</p>
          </div>
        ) : (
          <>
            {/* Loading overlay for page changes */}
            {loading && places.length > 0 && (
              <div className="fixed inset-0 bg-white/50 z-10 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            )}

            {/* Mobile View */}
            <div className="lg:hidden space-y-2">
              {places.map((place) => (
                <div key={place.placeId} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Place Image */}
                  {place.imageUrls && place.imageUrls.length > 0 ? (
                    <div className="relative w-full h-40">
                      <Image
                        src={place.imageUrls[0]}
                        alt={place.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  <div className="p-3">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">{place.name}</h3>
                      <span className={`shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusColor(place.status)}`}>
                        {place.status}
                      </span>
                    </div>

                    {/* Address */}
                  {place.address && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{place.address}</p>
                  )}

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-400 block text-[10px] mb-0.5">Location</span>
                      <span className="text-gray-700 font-medium text-[11px]">
                        {place.geo.lat.toFixed(4)}, {place.geo.lng.toFixed(4)}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-400 block text-[10px] mb-0.5">Source</span>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${getSourceColor(place.source)}`}>
                        {place.source.replace("_", " ")}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-400 block text-[10px] mb-0.5">Geohash</span>
                      <span className="text-gray-700 font-mono text-[11px]">{place.geohash || <span className="text-gray-400">—</span>}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-400 block text-[10px] mb-0.5">Categories</span>
                      <span className="text-gray-700 font-medium text-[11px]">{place.categories.length || 0}</span>
                    </div>
                  </div>

                  {/* Categories */}
                  {place.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {place.categories.slice(0, 3).map((cat, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">{cat}</span>
                      ))}
                      {place.categories.length > 3 && (
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">+{place.categories.length - 3}</span>
                      )}
                    </div>
                  )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button onClick={() => handleEditPlace(place as Place_)} className="flex-1 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteClick(place as Place_)} className="flex-1 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5 w-20">Image</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Place</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Location</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Geohash</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Categories</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Source</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Status</th>
                    <th className="text-center font-medium text-gray-600 px-3 py-2.5 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {places.map((place) => (
                    <tr key={place.placeId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2.5">
                        {place.imageUrls && place.imageUrls.length > 0 ? (
                          <Image
                            src={place.imageUrls[0]}
                            alt={place.name}
                            width={56}
                            height={56}
                            className="rounded-md object-cover h-10 w-10 sm:h-14 sm:w-14"
                            sizes="56px"
                          />
                        ) : (
                          <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-md bg-gray-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-900">{place.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{place.address || '—'}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-gray-700 font-mono text-xs">
                          {place.geo.lat.toFixed(4)}, {place.geo.lng.toFixed(4)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-gray-600 font-mono text-xs">
                          {place.geohash || <span className="text-gray-400">—</span>}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {place.categories.slice(0, 2).map((cat, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{cat}</span>
                          ))}
                          {place.categories.length > 2 && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{place.categories.length - 2}</span>
                          )}
                          {place.categories.length === 0 && <span className="text-gray-400 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getSourceColor(place.source)}`}>
                          {place.source.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(place.status)}`}>
                          {place.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEditPlace(place as Place_)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDeleteClick(place as Place_)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
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

            {/* Pagination */}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              totalItems={pagination.total}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </>
        )}
      </div>

      <PlaceFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedPlace(null); }}
        onSubmit={handleSubmitPlace}
        place={selectedPlace}
        availableCategories={categories}
      />

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Place"
        message="Are you sure you want to delete this place? This action cannot be undone."
        itemName={placeToDelete?.name}
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
