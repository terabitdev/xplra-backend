'use client';

import { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }), // Send email to the API for password reset
      });

      const data = await res.json();

      if (res.ok) {
        // Show success message
        setMessage('Password reset link has been sent to your email.');
      } else {
        setError(data.error); // Handle any errors returned by the API
      }
    } catch (err) {
      setError('An error occurred while sending the password reset email.');
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <h2 className="mb-4 text-2xl font-bold">Forgot Password</h2>
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
        <button type="submit" className="w-full bg-bootstrap-primary hover:bg-bootstrap-primary-hover text-white font-medium py-2 px-4 rounded">Send Reset Link</button>
        {message && <div className="mt-3 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">{message}</div>}
        {error && <div className="mt-3 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
      </form>
    </div>
  );
}
