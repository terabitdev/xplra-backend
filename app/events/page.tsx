"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchEvents, deleteEvent } from "../store/slices/eventsSlice";
import EventFormModal from "../components/modals/EventFormModal";
import DeleteDialog from "../components/ui/DeleteDialog";
import Toaster from "../components/ui/Toaster";
import EventsFilter from "../components/filters/EventsFilter";
import { Event } from "@/lib/domain/models/event";
import { useSearch } from "../contexts/SearchContext";
import Image from "next/image";
import CustomScrollbar from "../components/ui/CustomScrollbar";

export default function EventsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [adminId, setAdminId] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedVisibility, setSelectedVisibility] = useState<boolean | null>(null);
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', isVisible: false });
  const dispatch = useAppDispatch();
  const { searchQuery } = useSearch();

  // Get events from Redux store
  const { events, loading, error } = useAppSelector((state) => state.events);
  const { uid } = useAppSelector((state) => state.user);

  // Filter events based on search query and visibility
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filter by visibility
    if (selectedVisibility !== null) {
      filtered = filtered.filter((event) => event.isVisible === selectedVisibility);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [events, searchQuery, selectedVisibility]);

  // Set admin ID from user uid
  useEffect(() => {
    if (uid) {
      setAdminId(uid);
    }
  }, [uid]);

  // Fetch events using Redux on mount
  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  // Open delete dialog
  const handleDeleteClick = useCallback((event: Event) => {
    setEventToDelete(event);
    setIsDeleteDialogOpen(true);
  }, []);

  // Confirm delete event
  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteEvent(eventToDelete.id)).unwrap();
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
      setToast({ message: 'Event deleted successfully', type: 'success', isVisible: true });
    } catch (error) {
      console.error("Failed to delete event:", error);
      setToast({ message: 'Failed to delete event. Please try again.', type: 'error', isVisible: true });
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setEventToDelete(null);
  };

  // Open edit modal
  const handleEditEvent = useCallback(
    (event: Event) => {
      // Ensure event has userId set to current admin
      const eventWithUserId = {
        ...event,
        userId: adminId || event.userId,
      };
      setSelectedEvent(eventWithUserId);
      setIsModalOpen(true);
    },
    [adminId]
  );

  // Open create modal
  const handleCreateEvent = useCallback(() => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  }, []);

  // Handle form submission
  const handleSubmitEvent = async (event: Partial<Event>, imageFile: File | null) => {
    try {
      const formData = new FormData();
      formData.append("event", JSON.stringify(event));
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const url = selectedEvent
        ? `/api/events/${selectedEvent.id}`
        : "/api/events/create";
      const method = selectedEvent ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (res.ok) {
        // Refresh events list
        dispatch(fetchEvents());
        setIsModalOpen(false);
        setSelectedEvent(null);
        const message = selectedEvent ? 'Event updated successfully' : 'Event created successfully';
        setToast({ message, type: 'success', isVisible: true });
      } else {
        const errorData = await res.json();
        setToast({ message: errorData.error || 'Failed to save event', type: 'error', isVisible: true });
      }
    } catch (error) {
      console.error("Error submitting event:", error);
      setToast({ message: 'An error occurred while saving the event', type: 'error', isVisible: true });
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full p-2 mt-3 sm:mt-7 lg:mt-0 sm:p-4 lg:py-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Events Management
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Create and manage your events</p>
          </div>
          <button
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
            onClick={handleCreateEvent}
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
            <span className="hidden sm:inline">Create New Event</span>
            <span className="sm:hidden">New Event</span>
          </button>
        </div>

        {/* Filter Section */}
        <EventsFilter
          selectedVisibility={selectedVisibility}
          onVisibilityChange={setSelectedVisibility}
        />

        {/* Search/Filter Results Count */}
        {(searchQuery || selectedVisibility !== null) && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">{filteredEvents.length}</span>{" "}
              {filteredEvents.length === 1 ? "event" : "events"} found
              {searchQuery && ` for "${searchQuery}"`}
              {selectedVisibility !== null &&
                ` (${selectedVisibility ? 'Visible' : 'Hidden'} only)`}
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
              Loading events...
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
              {filteredEvents.length === 0 ? (
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-600 text-lg font-medium">No events found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {events.length === 0
                      ? "Create your first event to get started"
                      : "No events match your search"}
                  </p>
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Event Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <Image
                        src={event.imageUrl}
                        alt={event.title}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-lg object-cover shadow-sm border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${
                            event.isVisible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {event.isVisible ? 'Visible' : 'Hidden'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Event Details Grid */}
                    <div className="space-y-2 mb-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(event.date).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="text-xs">Lat: {event.latitude.toFixed(4)}, Lng: {event.longitude.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-semibold">{event.experience} XP</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        className="flex-1 py-2 px-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                        onClick={() => handleEditEvent(event)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        className="flex-1 py-2 px-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                        onClick={() => handleDeleteClick(event)}
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
              <CustomScrollbar className="overflow-x-auto max-h-[600px]">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      XP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Visibility
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-[120px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
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
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-gray-600 text-lg font-medium">
                            No events found
                          </p>
                          <p className="text-gray-400 text-sm mt-1">
                            {events.length === 0
                              ? "Create your first event to get started"
                              : "No events match your search"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((event) => (
                      <tr
                        key={event.id}
                        className="hover:bg-blue-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Image
                              src={event.imageUrl}
                              alt={event.title}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-lg object-cover shadow-sm border border-gray-200 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {event.title}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {new Date(event.date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(event.date).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[11px] text-gray-600 space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-gray-500">Lat:</span>
                              <span>{event.latitude.toFixed(4)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-gray-500">Lng:</span>
                              <span>{event.longitude.toFixed(4)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4 text-yellow-500 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-900">
                              {event.experience}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            event.isVisible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {event.isVisible ? 'Visible' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-150"
                              onClick={() => handleEditEvent(event)}
                              title="Edit event"
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
                              onClick={() => handleDeleteClick(event)}
                              title="Delete event"
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
            </CustomScrollbar>
          </div>
          </>
        )}
      </div>

      {/* Event Form Modal */}
      <EventFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        onSubmit={handleSubmitEvent}
        event={selectedEvent}
        adminId={adminId}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone and all associated data will be permanently removed."
        itemName={eventToDelete?.title}
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
