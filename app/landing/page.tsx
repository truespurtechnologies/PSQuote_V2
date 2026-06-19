"use client"

// Force dynamic rendering since this page uses client-side auth
export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { UserProfile } from '@/components/user-profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User, Activity, Bell, FileText, Plus, Settings } from 'lucide-react';
import profileService from '@/lib/supabase/profile-service';
import { supabase } from '@/lib/supabase/client';

// Error boundary component with fallback support
interface ErrorBoundaryProps {
  children: React.ReactNode;
  FallbackComponent?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, { error: Error | null }> {
  state = { error: null } as { error: Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error } as { error: Error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, info);
    } else {
      console.error('Error in ErrorBoundary:', error, info);
    }
  }

  resetErrorBoundary = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, FallbackComponent } = this.props;

    if (error) {
      if (FallbackComponent) {
        return <FallbackComponent error={error} resetErrorBoundary={this.resetErrorBoundary} />;
      }
      return (
        <div className="p-4 text-red-600 bg-red-50 rounded">
          <p>Something went wrong:</p>
          <pre className="mt-2 text-sm">{error.message}</pre>
          <button
            onClick={this.resetErrorBoundary}
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
          >
            Try again
          </button>
        </div>
      );
    }

    return children;
  }
}

// Loading spinner component
function LoadingSpinner({ 
  message, 
  className = '', 
  iconClassName = '', 
  textClassName = '' 
}: { 
  message: string; 
  className?: string; 
  iconClassName?: string; 
  textClassName?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 ${iconClassName}`}></div>
      <p className={`mt-4 text-lg font-medium ${textClassName}`}>{message}</p>
    </div>
  );
}

function LandingPageContent() {
  const router = useRouter();
  const { session, isLoading, error, signOut } = useAuth(true);
  const [userDisplayName, setUserDisplayName] = useState('User');
  const [todaysQuoteCount, setTodaysQuoteCount] = useState<number | null>(null);
  const [todayLabel, setTodayLabel] = useState<string>('');
  const [monthlyQuoteCount, setMonthlyQuoteCount] = useState<number | null>(null);
  const [monthLabel, setMonthLabel] = useState<string>('');
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Fetch user profile from database
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user?.id) return;
      
      try {
        // Try to get profile by user ID first
        const profile = await profileService.getProfile(session.user.id);
        
        if (profile?.full_name) {
          setUserDisplayName(profile.full_name);
          return;
        }
        
        // If no full_name, try to get by email as fallback
        if (session.user.email) {
          const profileByEmail = await profileService.getProfileByEmail(session.user.email);
          if (profileByEmail?.full_name) {
            setUserDisplayName(profileByEmail.full_name);
            return;
          }
        }
        
        // Fallback to email username if available
        if (session.user.email) {
          setUserDisplayName(session.user.email.split('@')[0]);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to email if available
        if (session.user?.email) {
          setUserDisplayName(session.user.email.split('@')[0]);
        }
      }
    };
    
    if (session?.user) {
      fetchUserProfile();
    }
  }, [session]);

  // Fetch today's quotations count
  useEffect(() => {
    // Prepare a friendly date label once on mount
    const now = new Date();
    const label = now.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
    setTodayLabel(label);

    // Only query after auth is determined; count can be global for the workspace
    const fetchCount = async () => {
      try {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const { count, error: countError } = await supabase
          .from('quotations')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', start.toISOString())
          .lt('created_at', end.toISOString());

        if (countError) throw countError;
        setTodaysQuoteCount(typeof count === 'number' ? count : 0);
      } catch (e) {
        console.error('Failed to fetch today\'s quotation count:', e);
        setTodaysQuoteCount(0);
      }
    };

    // Trigger after we know session state; if you want per-user counts, filter by created_by = session.user.id
    if (!isLoading) {
      fetchCount();
    }
  }, [isLoading]);

  // Fetch current month's quotations count
  useEffect(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const label = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    setMonthLabel(label);

    const fetchMonthlyCount = async () => {
      try {
        const { count, error: countError } = await supabase
          .from('quotations')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', monthStart.toISOString())
          .lt('created_at', nextMonthStart.toISOString());

        if (countError) throw countError;
        setMonthlyQuoteCount(typeof count === 'number' ? count : 0);
      } catch (e) {
        console.error('Failed to fetch monthly quotation count:', e);
        setMonthlyQuoteCount(0);
      }
    };

    if (!isLoading) {
      fetchMonthlyCount();
    }
  }, [isLoading]);
  
  const handleLogout = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      // Redirect is handled centrally by EnhancedAuth on SIGNED_OUT
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  // Show loading state or redirect if no session
  if (isLoading || !session) {
    // If we're not loading but have no session, redirect to login
    if (!isLoading && !session) {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      return null;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner 
          message="Preparing your dashboard..." 
          className="min-h-screen"
          iconClassName="h-16 w-16 mb-4"
          textClassName="text-white"
        />
      </div>
    );
  }

  // Show error state if needed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="w-full max-w-md border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">
              <div className="flex items-center space-x-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
                <span>Session Error</span>
              </div>
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              <p className="mb-2">We encountered an issue with your session:</p>
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg 
                      className="h-5 w-5 text-red-500" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Please try again or contact support if the issue persists.
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col space-y-3 pt-0">
            {/* Standalone navigation button to avoid nesting buttons */}
            <Button 
              onClick={() => (window.location.href = '/')}
              className="bg-red-600 hover:bg-red-700 transition-colors duration-200"
            >
              Go to Login
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-white text-black shadow-lg border-b-4 border-red-500">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Popular Steels Quotation Application</h1>
          </div>
          <div className="flex items-center space-x-4">
            {session && (
              <div className="flex items-center space-x-2">
                <ErrorBoundary
                  FallbackComponent={ErrorFallback}
                  onError={(error) => {
                    console.error('Error in UserProfile:', error);
                  }}
                >
                  <UserProfile 
                    displayName={userDisplayName}
                    email={session?.email}
                    className="mr-2"
                  />
                </ErrorBoundary>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  disabled={isSigningOut}
                  className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span>{isSigningOut ? 'Signing out…' : 'Logout'}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">Welcome, {userDisplayName}!</h2>
          <p className="text-gray-300 text-lg">
            You have successfully logged into Popular Steels Quotation Generator Application
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-2 border-red-500 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-black">Profile</CardTitle>
              <User className="h-4 w-4 ml-auto text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">Active</div>
              <CardDescription className="text-gray-600">Manage your account settings</CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-red-500 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-black">Activity</CardTitle>
              <Activity className="h-4 w-4 ml-auto text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{todaysQuoteCount ?? '—'}</div>
              <CardDescription className="text-gray-600">
                {`Quotations created ${todayLabel || 'today'}`}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-red-500 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-black">Activity</CardTitle>
              <Activity className="h-4 w-4 ml-auto text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{monthlyQuoteCount ?? '—'}</div>
              <CardDescription className="text-gray-600">
                {`Quotations created in the month of ${monthLabel || '—'}`}
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-6 border-2 border-red-500">
          <h3 className="text-xl font-bold text-black mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => router.push("/existing-quotations")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Existing Quotation
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => router.push("/new-quotation")}>
              <Plus className="h-4 w-4 mr-2" />
              New Quotation
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => router.push("/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => router.push("/quick-load-slip")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Quick Load Slip
            </Button>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mt-8 text-center">
          <div className="bg-red-600 text-white p-6 rounded-lg">
            <h3 className="text-2xl font-bold mb-2">🎉 Login Successful!</h3>
            <p className="text-lg">Welcome back! You're now logged in to your dashboard.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md border-red-500">
        <CardHeader>
          <CardTitle className="text-red-500">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white">{error.message}</p>
          <Button 
            onClick={resetErrorBoundary}
            className="mt-4 w-full bg-red-600 hover:bg-red-700"
          >
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Main page component
export default function LandingPage() {
  return (
    <ErrorBoundary>
      <LandingPageContent />
    </ErrorBoundary>
  );
}
