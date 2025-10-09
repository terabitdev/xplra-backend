'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }), // Send email and password to API
      });

      const data = await res.json();

      if (res.ok) {
        // Handle successful sign-up, e.g., store the token and redirect
        localStorage.setItem('token', data.user.token); // Assuming token is part of the response
        router.push('/'); // Redirect to home page
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('An error occurred during sign-up.');
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <h2 className="mb-4 text-2xl font-bold">Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="block mb-2 text-sm font-medium">Email address</label>
          <input
            type="email"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="block mb-2 text-sm font-medium">Password</label>
          <input
            type="password"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="w-full bg-bootstrap-primary hover:bg-bootstrap-primary-hover text-white font-medium py-2 px-4 rounded">Sign Up</button>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-3">{error}</div>}

        <p className="mt-3">
          Already have an account? <Link href="/signin" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
