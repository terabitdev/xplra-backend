'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }), // Send credentials to the API
      });

      const data = await res.json();

      if (res.ok) {
        // Store the token in localStorage (or cookies)
        localStorage.setItem('token', data.token); // Store the token received from the API
        router.push('/'); // Redirect to home page
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('An error occurred during sign-in.');
    }
  };



  return (
    <div className="container mt-5">
      <h2 className="mb-4">Sign In</h2>
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
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">Sign In</button>

        {error && <div className="alert alert-danger mt-3">{error}</div>}

        <p className="mt-3">
          Don't have an account? <Link href="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
