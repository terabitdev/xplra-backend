"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "../components/DashboardLayout";
import PlayerReport_DetailModal from "../components/modals/PlayerReport_DetailModal";
import Pagination from "../components/ui/Pagination";
import TableSkeleton from "../components/ui/TableSkeleton";
import CardSkeleton from "../components/ui/CardSkeleton";
import { AppDispatch, RootState } from "../store";
import {
  fetchPlayerReports,
  clearError,
  setStatusFilter,
  PlayerReportStatusFilter,
} from "../store/slices/playerReportsSlice";

const TABS: { key: PlayerReportStatusFilter; label: string }[] = [
  { key: "OPEN", label: "Open" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "DISMISSED", label: "Dismissed" },
  { key: "all", label: "All" },
];

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getReasonStyle(reason: string) {
  const lower = reason.toLowerCase();
  if (lower.includes("harass") || lower.includes("bully")) return "bg-red-100 text-red-600";
  if (lower.includes("safety")) return "bg-amber-100 text-amber-700";
  if (lower.includes("spam")) return "bg-blue-100 text-blue-700";
  if (lower.includes("fake") || lower.includes("impersonat")) return "bg-purple-100 text-purple-700";
  if (lower.includes("inappropriate") || lower.includes("offensive")) return "bg-orange-100 text-orange-700";
  return "bg-gray-100 text-gray-600";
}

function getStatusStyle(status: string) {
  if (status === "OPEN") return "bg-amber-100 text-amber-700";
  if (status === "RESOLVED") return "bg-green-100 text-green-700";
  if (status === "DISMISSED") return "bg-gray-100 text-gray-500";
  return "bg-blue-100 text-blue-700";
}

export default function PlayerReportsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { reports, loading, error, pagination, counts, statusFilter, lastFetched } = useSelector(
    (state: RootState) => state.playerReports
  );

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const isDataStale = !lastFetched || Date.now() - lastFetched > 5 * 60 * 1000;

  useEffect(() => {
    if (reports.length === 0 || isDataStale || pagination.page !== currentPage) {
      dispatch(fetchPlayerReports({ page: currentPage, limit: 20, status: statusFilter }));
    }
  }, [dispatch, currentPage, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (error) dispatch(clearError());
  }, [error, dispatch]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    dispatch(fetchPlayerReports({ page, limit: 20, status: statusFilter }));
  };

  const handleTabChange = (tab: PlayerReportStatusFilter) => {
    dispatch(setStatusFilter(tab));
    setCurrentPage(1);
    dispatch(fetchPlayerReports({ page: 1, limit: 20, status: tab }));
  };

  const handleResolved = () => {
    dispatch(fetchPlayerReports({ page: currentPage, limit: 20, status: statusFilter }));
  };

  return (
    <DashboardLayout>
      <div className="w-full p-4 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Player Reports</h1>
            <p className="text-gray-500 text-sm">Moderation queue for reports players file against other players</p>
          </div>

          <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-lg text-sm w-fit">
            {TABS.map((tab) => {
              const isActive = statusFilter === tab.key;
              const count = tab.key === "all" ? counts.all : counts[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    isActive ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-xs text-gray-400">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {loading && reports.length === 0 ? (
          <>
            <div className="hidden lg:block">
              <TableSkeleton rows={8} columns={5} />
            </div>
            <div className="lg:hidden">
              <CardSkeleton count={6} />
            </div>
          </>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 py-12 text-center">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-gray-500 font-medium">
              {statusFilter === "all" ? "No reports yet" : `No ${statusFilter.toLowerCase()} reports`}
            </p>
            <p className="text-gray-400 text-sm">Reports players file against other players will appear here</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="lg:hidden space-y-2">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">
                      {report.reported?.name || report.reported?.username || report.reportedUid || "—"}
                    </h3>
                    <span className="shrink-0 text-[10px] text-gray-400">{formatDate(report.createdAt)}</span>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-1">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${getReasonStyle(report.reason)}`}>
                      {report.reason}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${getStatusStyle(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Reported by {report.reporter?.name || report.reporter?.email || report.reporterUid}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Reported Player</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Reason</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Status</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Reporter</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5 w-28">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      onClick={() => setSelectedReportId(report.id)}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-900">
                          {report.reported?.name || report.reported?.username || "—"}
                        </p>
                        <p className="text-xs text-gray-400">{report.reported?.email || report.reportedUid}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getReasonStyle(report.reason)}`}>
                          {report.reason}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-sm text-gray-800">{report.reporter?.name || "—"}</p>
                        <p className="text-xs text-gray-400">{report.reporter?.email || report.reporterUid}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs text-gray-500">{formatDate(report.createdAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
              />
            )}
          </>
        )}
      </div>

      <PlayerReport_DetailModal
        isOpen={!!selectedReportId}
        onClose={() => setSelectedReportId(null)}
        reportId={selectedReportId}
        onResolved={handleResolved}
      />
    </DashboardLayout>
  );
}
