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
    <div className="container mt-5">
      <h2 className="mb-4">Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email address</label>
          <input
            type="email"
            className="form-control"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">Send Reset Link</button>
        {message && <div className="mt-3 alert alert-success">{message}</div>}
        {error && <div className="mt-3 alert alert-danger">{error}</div>}
      </form>
    </div>
  );
}
