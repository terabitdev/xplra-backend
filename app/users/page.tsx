'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import Toaster from '../components/ui/Toaster';
import Pagination from '../components/ui/Pagination';
import TableSkeleton from '../components/ui/TableSkeleton';
import CardSkeleton from '../components/ui/CardSkeleton';
import { AppDispatch, RootState } from '../store';
import { fetchUsers } from '../store/slices/usersSlice';
import { User as UserIcon } from '@carbon/icons-react';

export default function UsersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { users, loading, error, pagination, lastFetched } = useSelector((state: RootState) => state.users);
  const [toast, setToast] = useState({ message: '', type: 'success' as 'success' | 'error', isVisible: false });
  const [currentPage, setCurrentPage] = useState(1);

  // Check if data is stale (older than 5 minutes)
  const isDataStale = !lastFetched || (Date.now() - lastFetched > 5 * 60 * 1000);

  // Fetch users on mount or when page changes
  useEffect(() => {
    if (users.length === 0 || isDataStale || pagination.page !== currentPage) {
      dispatch(fetchUsers({ page: currentPage, limit: 20 }));
    }
  }, [dispatch, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    dispatch(fetchUsers({ page, limit: 20 }));
  };

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error', isVisible: true });
    }
  }, [error]);

  const handleUserClick = (uid: string) => {
    router.push(`/users/${uid}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="w-full p-4 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Users</h1>
            <p className="text-gray-500 text-sm">Manage user accounts and XP</p>
          </div>
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
            Total: <span className="font-semibold text-gray-900">{users.length}</span>
          </div>
        </div>

        {loading && users.length === 0 ? (
          <>
            {/* Desktop Skeleton */}
            <div className="hidden lg:block">
              <TableSkeleton rows={10} columns={6} showImage={true} />
            </div>
            {/* Mobile Skeleton */}
            <div className="lg:hidden">
              <CardSkeleton count={6} />
            </div>
          </>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 py-12 text-center">
            <UserIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">No users found</p>
            <p className="text-gray-400 text-sm">Users will appear here once registered</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">XP Total</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last XP Update</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr
                        key={user.uid}
                        onClick={() => handleUserClick(user.uid)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-600 text-sm font-medium">
                                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900">{user.displayName || 'Unnamed User'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.email || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.type === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {user.type || 'user'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-semibold text-indigo-600">{user.xpTotal?.toLocaleString() || 0}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(user.lastXpUpdate)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {users.map((user) => (
                <div
                  key={user.uid}
                  onClick={() => handleUserClick(user.uid)}
                  className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'User'} className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-indigo-600 text-lg font-medium">
                          {(user.displayName || user.email || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{user.displayName || 'Unnamed User'}</h3>
                      <p className="text-sm text-gray-500 truncate">{user.email || 'No email'}</p>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${
                        user.type === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.type || 'user'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs block">XP Total</span>
                      <span className="font-semibold text-indigo-600">{user.xpTotal?.toLocaleString() || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block">Last XP Update</span>
                      <span className="text-gray-700">{formatDate(user.lastXpUpdate)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block">Joined</span>
                      <span className="text-gray-700">{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
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

      <Toaster
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </DashboardLayout>
  );
}
