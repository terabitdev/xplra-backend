'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type VerifyState = 'verifying' | 'valid' | 'invalid';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const [verifyState, setVerifyState] = useState<VerifyState>('verifying');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setVerifyState('invalid');
      setVerifyError('This reset link is missing or malformed.');
      return;
    }

    fetch('/api/reset-password/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oobCode }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setVerifyState('valid');
        } else {
          setVerifyState('invalid');
          setVerifyError(data.error || 'This reset link is invalid or has expired.');
        }
      })
      .catch(() => {
        setVerifyState('invalid');
        setVerifyError('Something went wrong. Please try again.');
      });
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (newPassword.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oobCode, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
      } else {
        setFormError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setFormError('Something went wrong. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-10">
          <div className="flex justify-center mb-6">
            <Image src="/assets/xplralogo.png" alt="Xplra Logo" width={100} height={100} className="object-contain" />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              {isSuccess ? 'Password Reset' : 'Set a New Password'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isSuccess
                ? 'Your password has been updated successfully'
                : "Choose a new password for your account"}
            </p>
          </div>

          {verifyState === 'verifying' && (
            <div className="flex items-center justify-center py-6">
              <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}

          {verifyState === 'invalid' && (
            <div className="space-y-5">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {verifyError}
              </div>
              <Link
                href="/forgot-password"
                className="block w-full text-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                Request a new link
              </Link>
            </div>
          )}

          {verifyState === 'valid' && !isSuccess && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                  placeholder="Enter a new password"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                  placeholder="Re-enter the new password"
                  minLength={8}
                  required
                />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          {isSuccess && (
            <div className="space-y-5">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                You can now sign in with your new password.
              </div>
              <Link
                href="/signin"
                className="block w-full text-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
