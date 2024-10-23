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
    <div className="d-flex">
      <Sidebar />
      <div className="main-content container-fluid">
        <div className="row mt-5">
          <div className="col-12">
            <h1>Welcome to the Home Page</h1>
            <p className="lead">You are logged in!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
