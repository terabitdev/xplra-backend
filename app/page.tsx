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
      <div className="w-full mt-8">
        <h1 className=" text-2xl sm:text-4xl font-bold mb-6">Welcome to the Dashboard</h1>

        {/* Metrics Cards */}
        <MetricsCards />

        {/* User Growth Graph */}
        <UserGrowthGraph />
      </div>
    </DashboardLayout>
  );
}
