'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/enhanced-auth-context';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/types/auth-forms';
import { cn } from '@/lib/utils';

// Simple logger implementation
const log = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, context || '');
  },
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, context || '');
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, context || '');
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    console.debug(`[DEBUG] ${message}`, context || '');
  },
};

// Define custom error class for login errors
class LoginError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'LoginError';
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LoginError);
    }
  }
}

export function LoginContent() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get URL parameters safely
  const registeredParam = searchParams?.get('registered');
  const resetParam = searchParams?.get('reset');
  
  // State management
  const [isRegistered, setIsRegistered] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Update states when URL parameters change
  useEffect(() => {
    const registered = searchParams?.get('registered') === 'true';
    const reset = searchParams?.get('reset') === 'success';
    
    setIsRegistered(registered);
    setResetSuccess(reset);
    
    log.debug('LoginContent - URL Params:', { registered, reset });
  }, [searchParams]);
  
  // Initialize form
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });
  
  const { register, formState: { errors } } = form;

  // Handle form submission
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get form data safely
    let formData;
    try {
      formData = form.getValues();
    } catch (formError) {
      console.error('Error getting form values:', formError);
      setError('Failed to process the form. Please try again.');
      return;
    }
    
    // Reset states
    setError(null);
    setIsLoading(true);
    
    // Extract email for logging (safely)
    const email = formData?.email || 'unknown';
    
    try {
      log.info('Attempting login', { email });
      
      // Basic validation
      if (!formData?.email || !formData?.password) {
        setError('Email and password are required');
        setIsLoading(false);
        return;
      }
      
      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }
      
      // Validate password length
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }
      
      // Attempt to sign in
      log.info('Initiating sign in', { email });
      
      try {
        const result = await signIn(formData.email, formData.password);
        
        if (result.error) {
          // The error is already handled in the auth context with user-friendly messages
          setError(result.error.message);
          setIsLoading(false);
          return;
        }
        
        // If we get here, login was successful
        log.info('Login successful, checking session...');
        
        // Get the current session to verify
        if (!supabase) {
          setError('Authentication service not available. Please refresh the page.');
          setIsLoading(false);
          return;
        }
        
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !currentSession) {
          log.error('Session check failed', { 
            error: sessionError,
            email 
          });
          setError('Your session could not be verified. Please try again.');
          setIsLoading(false);
          return;
        }
        
        log.info('Session verified, preparing to redirect...');
        
        // Check if we need to redirect to a protected page
        let redirectTo = searchParams?.get('redirectedFrom') || searchParams?.get('redirectTo') || '/landing';
        
        // Don't redirect to root path - always use /landing instead
        if (redirectTo === '/') {
          redirectTo = '/landing';
        }
        
        // Wait for cookies to be set - Supabase SSR needs time to write cookies
        // This prevents race condition where middleware doesn't see the session yet
        await new Promise(resolve => setTimeout(resolve, 300));
        
        log.info('Redirecting to: ' + redirectTo);
        
        // Use replace instead of push to prevent going back to login page with browser back button
        router.replace(redirectTo);
        return; // Ensure we don't continue execution after redirect
        
      } catch (error) {
        // This catch block is a fallback in case the error wasn't properly caught in the auth context
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        
        // Safe logging
        try {
          log.error('Sign in error:', { 
            error: errorMessage,
            email,
            stack: error instanceof Error ? error.stack : undefined
          });
        } catch (logError) {
          console.error('Failed to log error:', logError);
        }
        
        // Map error to user-friendly message
        const errorMessageLower = errorMessage.toLowerCase();
        let userFriendlyMessage = 'An error occurred during sign in. Please try again.';
        
        if (errorMessageLower.includes('invalid login credentials') || 
            errorMessageLower.includes('invalid email or password')) {
          userFriendlyMessage = 'The email or password you entered is incorrect. Please try again.';
        } else if (errorMessageLower.includes('email not confirmed') ||
                  errorMessageLower.includes('email not verified')) {
          userFriendlyMessage = 'Please verify your email before signing in. Check your inbox for a verification link.';
        } else if (errorMessageLower.includes('network') || 
                  errorMessageLower.includes('fetch') ||
                  errorMessageLower.includes('failed to fetch')) {
          userFriendlyMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (errorMessageLower.includes('too many requests')) {
          userFriendlyMessage = 'Too many login attempts. Please wait a few minutes and try again.';
        }
        
        setError(userFriendlyMessage);
      }
    } catch (error) {
      // Handle any unexpected errors in the form submission
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      // Safe error logging
      try {
        log.error('Form submission error:', { 
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        });
      } catch (logError) {
        console.error('Failed to log form submission error:', logError);
      }
      
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle success messages and redirects
  useEffect(() => {
    if (isRegistered || resetSuccess) {
      const timer = setTimeout(() => {
        // Clear the success message and reset the URL without the query params
        router.replace('/login', { scroll: false });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isRegistered, resetSuccess, router]);

  // Show loading state while checking auth
  if (typeof window === 'undefined') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="mt-4 text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="bg-card text-card-foreground p-8 rounded-xl shadow-sm border">
          <div className="flex justify-center mb-6">
            <img 
              src="/images/popular-steels-logo.png" 
              alt="Popular Steels Logo" 
              className="h-16 w-auto"
            />
          </div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome to Popular Steels
            </h1>
            <p className="text-muted-foreground mt-2">Sign in to your account to continue</p>
          </div>
          
          {/* Success Messages */}
          {isRegistered && (
            <div className="mb-6 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Registration successful! Please sign in with your credentials.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {resetSuccess && (
            <div className="mb-6 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Your password has been reset successfully. Please sign in with your new password.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error}
                  </h3>
                  {error.toLowerCase().includes('password') && (
                    <div className="mt-2 text-sm text-red-700">
                      <p>Forgot your password?{' '}
                        <Link 
                          href="/forgot-password" 
                          className="font-medium text-red-600 hover:text-red-500 underline"
                          onClick={(e) => e.preventDefault()}
                        >
                          Reset it here
                        </Link>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email address
              </Label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  className={cn(
                    'pl-10',
                    errors.email && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  )}
                  {...register('email')}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                  Password
                </Label>
                <div className="text-sm">
                  <Link 
                    href="/forgot-password" 
                    className="font-medium text-primary hover:text-primary/80"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={cn(
                    'pl-10 pr-10',
                    errors.password && 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  )}
                  {...register('password')}
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <Button 
                type="submit" 
                variant={isLoading ? 'outline' : 'destructive'}
                className="w-full mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign in
                  </span>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/signup"
                className="w-full flex justify-center py-2 px-4 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-accent"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
