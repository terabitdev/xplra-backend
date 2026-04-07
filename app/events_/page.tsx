"use client";

import { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "../components/DashboardLayout";
import EventFormModal from "../components/modals/EventFormModal";
import DeleteDialog from "../components/ui/DeleteDialog";
import Toaster from "../components/ui/Toaster";
import Pagination from "../components/ui/Pagination";
import CardSkeleton from "../components/ui/CardSkeleton";
import TableSkeleton from "../components/ui/TableSkeleton";
import { AppDispatch, RootState } from "../store";
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  clearError,
} from "../store/slices/eventsSlice";
import { fetchValidationConfigs } from "../store/slices/validationConfigsSlice";
import { fetchPlaces } from "../store/slices/placesSlice";
import { Event } from "@/lib/domain/models/event";

const ITEMS_PER_PAGE = 20;

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { events, loading, error, pagination, lastFetched } = useSelector(
    (state: RootState) => state.events
  );
  const { configs: validationConfigs } = useSelector(
    (state: RootState) => state.validationConfigs
  );
  const { places } = useSelector((state: RootState) => state.places);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    type: "success" as "success" | "error",
    isVisible: false,
  });
  const [currentPage, setCurrentPage] = useState(1);

  const isDataStale = lastFetched ? Date.now() - lastFetched > 5 * 60 * 1000 : true;

  useEffect(() => {
    if (events.length === 0 || isDataStale || pagination.page !== currentPage) {
      dispatch(fetchEvents({ page: currentPage, limit: ITEMS_PER_PAGE }));
    }
    if (validationConfigs.length === 0) {
      dispatch(fetchValidationConfigs({ fresh: true }));
    }
    if (places.length === 0) {
      dispatch(fetchPlaces({ limit: 200 }));
    }
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: "error", isVisible: true });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleCreate = useCallback(() => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (eventData: Partial<Event>) => {
      try {
        if (selectedEvent) {
          await dispatch(
            updateEvent({ ...selectedEvent, ...eventData } as Event)
          ).unwrap();
          setToast({
            message: "Event updated successfully",
            type: "success",
            isVisible: true,
          });
        } else {
          await dispatch(createEvent(eventData)).unwrap();
          setToast({
            message: "Event created successfully",
            type: "success",
            isVisible: true,
          });
        }
        await dispatch(fetchEvents({ page: currentPage, limit: ITEMS_PER_PAGE, fresh: true }));
      } catch (err) {
        const errorMessage =
          typeof err === "string" ? err : "An error occurred";
        setToast({ message: errorMessage, type: "error", isVisible: true });
      }
      setIsModalOpen(false);
      setSelectedEvent(null);
    },
    [selectedEvent, dispatch, currentPage]
  );

  const handleToggleActive = useCallback(async (event: Event) => {
    try {
      await dispatch(updateEvent({ ...event, isActive: !event.isActive })).unwrap();
    } catch {
      setToast({ message: "Failed to update status", type: "error", isVisible: true });
    }
  }, [dispatch]);

  const handleDeleteClick = useCallback((event: Event) => {
    setEventToDelete(event);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteEvent(eventToDelete.eventId)).unwrap();
      setToast({
        message: "Event deleted successfully",
        type: "success",
        isVisible: true,
      });
    } catch (err) {
      const errorMessage =
        typeof err === "string" ? err : "Failed to delete event";
      setToast({ message: errorMessage, type: "error", isVisible: true });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  }, [eventToDelete, dispatch]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setEventToDelete(null);
  }, []);

  const showInitialLoading = loading && events.length === 0;

  return (
    <DashboardLayout>
      <div className="w-full p-4 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Events
            </h1>
            <p className="text-gray-500 text-sm">
              Manage events and their validation configs
              {pagination.total > 0 && (
                <span className="ml-2 text-gray-400">
                  ({pagination.total} total)
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
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
            <span className="hidden sm:inline">New Event</span>
          </button>
        </div>

        {showInitialLoading ? (
          <>
            <div className="lg:hidden">
              <CardSkeleton count={6} showImage={false} />
            </div>
            <div className="hidden lg:block">
              <TableSkeleton rows={8} columns={6} showImage={false} />
            </div>
          </>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 py-12 text-center">
            <svg
              className="w-10 h-10 text-gray-300 mx-auto mb-2"
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
            <p className="text-gray-500 font-medium">No events yet</p>
            <p className="text-gray-400 text-sm">Create your first event</p>
          </div>
        ) : (
          <>
            {loading && events.length > 0 && (
              <div className="fixed inset-0 bg-white/50 z-10 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            )}

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-2">
              {events.map((event) => (
                <div
                  key={event.eventId}
                  className="bg-white rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">
                      {event.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(event)}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                        event.isActive ? "bg-indigo-600" : "bg-gray-300"
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        event.isActive ? "translate-x-4" : "translate-x-0.5"
                      }`} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-400 block text-[10px] mb-0.5">Start</span>
                      <span className="text-gray-700 font-medium text-[11px]">
                        {formatDateTime(event.startTime)}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-400 block text-[10px] mb-0.5">End</span>
                      <span className="text-gray-700 font-medium text-[11px]">
                        {formatDateTime(event.endTime)}
                      </span>
                    </div>
                  </div>

                  {event.placeId && (
                    <p className="text-xs text-gray-500 mb-2 truncate">
                      Place: <span className="font-mono text-gray-700">{event.placeId}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1 mb-2">
                    {event.validationConfig?.mode && (
                      <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded text-[10px] font-medium">
                        {event.validationConfig.mode.replace('_', ' ')}
                      </span>
                    )}
                    {event.geoOverride && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
                        Geo Override
                      </span>
                    )}
                    {event.validationConfigId && (
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px]">
                        Validation Config
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">
                      Pre: {event.eventPreGraceMin}m / Post: {event.eventPostGraceMin}m
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(event)}
                      className="flex-1 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(event)}
                      className="flex-1 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Title</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Start</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">End</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Place / Geo</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Grace</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Status</th>
                    <th className="text-center font-medium text-gray-600 px-3 py-2.5 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {events.map((event) => (
                    <tr
                      key={event.eventId}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {event.validationConfig?.mode && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded font-medium">
                              {event.validationConfig.mode.replace('_', ' ')}
                            </span>
                          )}
                          {event.validationConfigId && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded">
                              Has Config
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-700">
                        {formatDateTime(event.startTime)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-700">
                        {formatDateTime(event.endTime)}
                      </td>
                      <td className="px-3 py-2.5">
                        {event.placeId ? (
                          <p className="text-xs font-mono text-gray-700 truncate max-w-[140px]" title={event.placeId}>
                            {event.placeId}
                          </p>
                        ) : null}
                        {event.geoOverride ? (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                            Geo Override
                          </span>
                        ) : null}
                        {!event.placeId && !event.geoOverride && (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-600">
                        Pre: {event.eventPreGraceMin}m
                        <br />
                        Post: {event.eventPostGraceMin}m
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(event)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            event.isActive ? "bg-indigo-600" : "bg-gray-300"
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            event.isActive ? "translate-x-6" : "translate-x-1"
                          }`} />
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(event)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(event)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
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

            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      <EventFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        onSubmit={handleSubmit}
        event={selectedEvent}
        availableValidationConfigs={validationConfigs}
        availablePlaces={places}
      />

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        itemName={eventToDelete?.title}
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
