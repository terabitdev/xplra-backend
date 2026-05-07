"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "../components/DashboardLayout";
import QuestReport_DetailModal from "../components/modals/QuestReport_DetailModal";
import Pagination from "../components/ui/Pagination";
import TableSkeleton from "../components/ui/TableSkeleton";
import CardSkeleton from "../components/ui/CardSkeleton";
import { AppDispatch, RootState } from "../store";
import { fetchQuestReports, clearError, QuestReport } from "../store/slices/questReportsSlice";

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
  if (lower.includes("location")) return "bg-amber-100 text-amber-700";
  if (lower.includes("offensive") || lower.includes("inappropriate")) return "bg-red-100 text-red-600";
  if (lower.includes("duplicate")) return "bg-blue-100 text-blue-700";
  if (lower.includes("broken") || lower.includes("completed")) return "bg-orange-100 text-orange-700";
  return "bg-gray-100 text-gray-600";
}

export default function QuestReportsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { reports, loading, error, pagination, lastFetched } = useSelector(
    (state: RootState) => state.questReports
  );

  const [selectedReport, setSelectedReport] = useState<QuestReport | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const isDataStale = !lastFetched || Date.now() - lastFetched > 5 * 60 * 1000;

  useEffect(() => {
    if (reports.length === 0 || isDataStale || pagination.page !== currentPage) {
      dispatch(fetchQuestReports({ page: currentPage, limit: 20 }));
    }
  }, [dispatch, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (error) dispatch(clearError());
  }, [error, dispatch]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    dispatch(fetchQuestReports({ page, limit: 20 }));
  };

  return (
    <DashboardLayout>
      <div className="w-full p-4 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Quest Reports</h1>
            <p className="text-gray-500 text-sm">User-submitted reports on quests</p>
          </div>
        </div>

        {loading && reports.length === 0 ? (
          <>
            <div className="hidden lg:block">
              <TableSkeleton rows={8} columns={4} />
            </div>
            <div className="lg:hidden">
              <CardSkeleton count={6} />
            </div>
          </>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 py-12 text-center">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            <p className="text-gray-500 font-medium">No reports yet</p>
            <p className="text-gray-400 text-sm">Reports submitted by users will appear here</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="lg:hidden space-y-2">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">
                      {(report.quest.title as string) || "—"}
                    </h3>
                    <span className="shrink-0 text-[10px] text-gray-400">{formatDate(report.reportedAt)}</span>
                  </div>
                  <div className="mb-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${getReasonStyle(report.reason)}`}>
                      {report.reason}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{report.reporter.displayName || report.reporter.email}</p>
                  <p className="text-[11px] text-gray-400">{report.reporter.email}</p>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Quest</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Reason</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5">Reporter</th>
                    <th className="text-left font-medium text-gray-600 px-3 py-2.5 w-28">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-900">{(report.quest.title as string) || "—"}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getReasonStyle(report.reason)}`}>
                          {report.reason}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-sm text-gray-800">{report.reporter.displayName || "—"}</p>
                        <p className="text-xs text-gray-400">{report.reporter.email}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs text-gray-500">{formatDate(report.reportedAt)}</span>
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

      <QuestReport_DetailModal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        report={selectedReport}
      />
    </DashboardLayout>
  );
}
