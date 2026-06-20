'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-enhanced-auth';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for password reset token in the URL
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        // If no session and no token in URL, redirect to login
        if (!data.session && !searchParams.get('access_token')) {
          router.push('/login?error=invalid_reset_token');
          return;
        }
        
        setHasValidSession(!!data.session);
      } catch (error) {
        console.error('Error checking session:', error);
        setMessage({
          type: 'error',
          text: 'An error occurred while verifying your session. Please try again.',
        });
      } finally {
        setIsCheckingSession(false);
      }
    };
    
    checkSession();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any existing messages
    setMessage(null);
    
    // Client-side validation
    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match. Please make sure both passwords match.',
      });
      return;
    }

    if (password.length < 8) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 8 characters long. Please choose a stronger password.',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Use the supabase client directly for password update
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (error) {
        // Handle specific error cases
        if (error.message.includes('New password should be different')) {
          throw new Error('The new password must be different from your current password.');
        } else if (error.message.includes('JWT expired')) {
          throw new Error('This password reset link has expired. Please request a new one.');
        } else if (error.message.includes('invalid token')) {
          throw new Error('Invalid or expired password reset link. Please request a new one.');
        }
        throw error;
      }
      
      // Show success message
      setMessage({
        type: 'success',
        text: 'Your password has been updated successfully! You will be redirected to the login page shortly.',
      });
      
      // Sign out the user after successful password reset
      await supabase.auth.signOut();
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?reset=success');
      }, 3000);
      
    } catch (error) {
      console.error('Error updating password:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to update password. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('JWT')) {
          errorMessage = 'This password reset link is invalid or has expired. Please request a new one.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setMessage({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto" />
          <p className="text-gray-600">Verifying your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {hasValidSession ? 'Update Your Password' : 'Reset Your Password'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {hasValidSession 
              ? 'Please enter your new password below.'
              : 'Please enter a new password for your account.'}
          </p>
        </div>

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            {message.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertTitle>{message.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Label htmlFor="password" className="sr-only">
                New Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>

        <div className="text-center">
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500 text-sm"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
