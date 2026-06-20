'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/use-enhanced-auth';
import Link from 'next/link';

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { updatePassword, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract the access token from the URL hash
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(hash.indexOf('#') + 1));
    const token = params.get('access_token');
    
    if (token) {
      setAccessToken(token);
    } else {
      setMessage({
        type: 'error',
        text: 'Invalid or expired reset link. Please request a new one.',
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match.',
      });
      return;
    }

    if (!accessToken) {
      setMessage({
        type: 'error',
        text: 'Invalid or expired reset link. Please request a new one.',
      });
      return;
    }

    setMessage(null);

    const { error } = await updatePassword(password);

    if (error) {
      console.error('Error resetting password:', error);
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred while resetting your password. Please try again.',
      });
    } else {
      setMessage({
        type: 'success',
        text: 'Your password has been updated successfully!',
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>

        {message && (
          <div
            className={`mt-4 p-4 rounded-md ${
              message.type === 'error' ? 'bg-red-50' : 'bg-green-50'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                message.type === 'error' ? 'text-red-800' : 'text-green-800'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                disabled={isLoading}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                disabled={isLoading}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !accessToken}
            >
              {isLoading ? 'Resetting password...' : 'Reset Password'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
