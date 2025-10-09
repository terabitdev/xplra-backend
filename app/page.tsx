'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './components/SideBar';

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
    <div className="flex">
      <Sidebar />
      <div className="main-content p-8 min-h-screen box-border overflow-y-auto">
        <div className="flex flex-wrap mt-12">
          <div className="w-full">
            <h1 className="text-4xl font-bold">Welcome to the Home Page</h1>
            <p className="text-xl text-gray-600 mt-2">You are logged in!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
