'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from './components/DashboardLayout';
import MetricsCards from './components/MetricsCards';
import UserGrowthGraph from './components/UserGrowthGraph';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          const res = await fetch('/api/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });

          if (!res.ok) {
            router.push('/signin');
          }
        } catch (err) {
          router.push('/signin');
        }
      } else {
        router.push('/signin');
      }
    };

    validateSession();
  }, [router]);

  return (
    <DashboardLayout>
      <div className="w-full mt-8">
        <h1 className="text-4xl font-bold mb-6">Welcome to the Dashboard</h1>

        {/* Metrics Cards */}
        <MetricsCards />

        {/* User Growth Graph */}
        <UserGrowthGraph />
      </div>
    </DashboardLayout>
  );
}
