"use client";

import { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "../components/DashboardLayout";
import ValidationConfigFormModal from "../components/modals/ValidationConfigFormModal";
import DeleteDialog from "../components/ui/DeleteDialog";
import Toaster from "../components/ui/Toaster";
import CardSkeleton from "../components/ui/CardSkeleton";
import TableSkeleton from "../components/ui/TableSkeleton";
import { AppDispatch, RootState } from "../store";
import {
  fetchValidationConfigs,
  createValidationConfig,
  updateValidationConfig,
  deleteValidationConfig,
  clearError,
} from "../store/slices/validationConfigsSlice";
import { ValidationConfig } from "@/lib/domain/models/validationConfig";

export default function ValidationConfigsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { configs, loading, error } = useSelector(
    (state: RootState) => state.validationConfigs
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ValidationConfig | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<ValidationConfig | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', isVisible: false });

  useEffect(() => {
    if (configs.length === 0) {
      dispatch(fetchValidationConfigs());
    }
  }, [dispatch, configs.length]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error', isVisible: true });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleCreate = useCallback(() => {
    setSelectedConfig(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((config: ValidationConfig) => {
    setSelectedConfig(config);
    setIsModalOpen(true);
  }, []);

  const handleSubmit = useCallback(async (configData: Partial<ValidationConfig>) => {
    try {
      if (selectedConfig) {
        await dispatch(updateValidationConfig({ id: selectedConfig.id, configData })).unwrap();
        setToast({ message: 'Config updated successfully', type: 'success', isVisible: true });
      } else {
        await dispatch(createValidationConfig(configData)).unwrap();
        setToast({ message: 'Config created successfully', type: 'success', isVisible: true });
      }
      await dispatch(fetchValidationConfigs({ fresh: true }));
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : 'An error occurred';
      setToast({ message: errorMessage, type: 'error', isVisible: true });
    }
    setIsModalOpen(false);
    setSelectedConfig(null);
  }, [selectedConfig, dispatch]);

  const handleDeleteClick = useCallback((config: ValidationConfig) => {
    setConfigToDelete(config);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!configToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteValidationConfig(configToDelete.id)).unwrap();
      setToast({ message: 'Config deleted successfully', type: 'success', isVisible: true });
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : 'Failed to delete config';
      setToast({ message: errorMessage, type: 'error', isVisible: true });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setConfigToDelete(null);
    }
  }, [configToDelete, dispatch]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setConfigToDelete(null);
  }, []);

  const showInitialLoading = loading && configs.length === 0;

  const getAuditColor = (level: string) => {
    const colors: Record<string, string> = {
      off: "bg-gray-100 text-gray-600",
      basic: "bg-blue-100 text-blue-700",
      verbose: "bg-purple-100 text-purple-700",
    };
    return colors[level] || "bg-gray-100 text-gray-700";
  };

  return (
    <DashboardLayout>
      <div className="w-full p-4 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Validation Configs</h1>
            <p className="text-gray-500 text-sm">
              Manage validation configurations for places
              {configs.length > 0 && (
                <span className="ml-2 text-gray-400">({configs.length} total)</span>
              )}
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New Config</span>
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
        ) : configs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 py-12 text-center">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-gray-500 font-medium">No validation configs yet</p>
            <p className="text-gray-400 text-sm">Create your first config</p>
          </div>
        ) : (
          <>
            {loading && configs.length > 0 && (
              <div className="fixed inset-0 bg-white/50 z-10 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            )}

            {/* Mobile View */}
            <div className="lg:hidden space-y-2">
              {configs.map((config) => (
                <div key={config.id} className="bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">{config.name}</h3>
                    <span className={`shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full ${getAuditColor(config.auditLogLevel)}`}>
                      {config.auditLogLevel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-400 block text-[10px] mb-0.5">Radius</span>
                      <span className="text-gray-700 font-medium text-[11px]">{config.radiusM}m</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-400 block text-[10px] mb-0.5">Dwell</span>
                      <span className="text-gray-700 font-medium text-[11px]">{config.dwellRequiredSec}s</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-400 block text-[10px] mb-0.5">Session TTL</span>
                      <span className="text-gray-700 font-medium text-[11px]">{config.sessionTtlSec}s</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-gray-400 block text-[10px] mb-0.5">Validate</span>
                      <span className="text-gray-700 font-medium text-[11px]">{config.timeToValidateSec}s</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {config.requireQrOrCode && <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded text-[10px]">QR/Code</span>}
                    {config.oneTimeOnly && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px]">One-Time</span>}
                    {config.useScheduleWindow && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">Scheduled</span>}
                    {config.denyIfMockLocationSuspected && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px]">Anti-Mock</span>}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button onClick={() => handleEdit(config)} className="flex-1 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteClick(config)} className="flex-1 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
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
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Name</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Geofence</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Timing</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Dwell</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Flags</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Audit</th>
                    <th className="text-center font-medium text-gray-600 px-3 py-2.5 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {configs.map((config) => (
                    <tr key={config.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-900">{config.name}</p>
                        <p className="text-xs text-gray-500">Pings: {config.checkInRequiredPings}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-gray-700 text-xs">{config.radiusM}m / {config.minAccuracyM}m acc</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-gray-700 text-xs">TTL: {config.sessionTtlSec}s</span>
                        <br />
                        <span className="text-gray-500 text-xs">Validate: {config.timeToValidateSec}s</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-gray-700 text-xs">{config.dwellRequiredSec}s required</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {config.requireQrOrCode && <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded text-xs">QR</span>}
                          {config.oneTimeOnly && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">1x</span>}
                          {config.useScheduleWindow && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Sched</span>}
                          {config.denyIfMockLocationSuspected && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">Mock</span>}
                          {!config.requireQrOrCode && !config.oneTimeOnly && !config.useScheduleWindow && !config.denyIfMockLocationSuspected && <span className="text-gray-400 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getAuditColor(config.auditLogLevel)}`}>
                          {config.auditLogLevel}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEdit(config)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDeleteClick(config)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
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
          </>
        )}
      </div>

      <ValidationConfigFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedConfig(null); }}
        onSubmit={handleSubmit}
        config={selectedConfig}
      />

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Validation Config"
        message="Are you sure you want to delete this config? This action cannot be undone."
        itemName={configToDelete?.name}
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
