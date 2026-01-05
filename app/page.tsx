'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from './components/DashboardLayout';
import MetricsCards from './components/MetricsCards';
import UserGrowthGraph from './components/UserGrowthGraph';
import { useAppDispatch } from './store/hooks';
import { validateSession } from './store/slices/authSlice';

export default function Home() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/signin');
        return;
      }

      try {
        // Dispatch Redux action to validate session and populate user data
        await dispatch(validateSession()).unwrap();
        // Session is valid, user data is now in Redux store
      } catch (err) {
        // Session validation failed
        router.push('/signin');
      }
    };

    checkAuth();
  }, [dispatch, router]);

  return (
    <DashboardLayout>
      <div className="w-full">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">
          Welcome to the Dashboard
        </h1>

        {/* Metrics Cards */}
        <MetricsCards />

        {/* User Growth Graph */}
        <UserGrowthGraph />
      </div>
    </DashboardLayout>
  );
}
