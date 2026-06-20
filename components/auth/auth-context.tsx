'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppUser, AuthState, initialAuthState, AppSession, UserMetadata } from '@/types/auth';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { toast } from '@/components/ui/use-toast';

// Debug function for auth context
const debug = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Auth Context] ${message}`, ...args);
  }
};

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ data: any; error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ data: any; error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const sessionRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshRetryCount = useRef(0);
  
  // Handle session timeout
  const handleSessionTimeout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      router.push('/login');
    }
  }, [router]);
  
  const handleSessionWarning = useCallback((remainingMinutes: number) => {
    // This will be shown by the useSessionTimeout hook
    console.log(`Session will expire in ${remainingMinutes} minutes`);
  }, []);
  
  // Initialize session timeout handler
  useSessionTimeout({
    onTimeout: handleSessionTimeout,
    onWarning: handleSessionWarning,
  });

  // Handle token refresh with retry logic
  const refreshSession = useCallback(async (): Promise<AppSession | null> => {
    if (isRefreshing) return null;
    
    try {
      setIsRefreshing(true);
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      if (data?.session) {
        const user = data.session.user as AppUser;
        const session: AppSession = {
          ...data.session,
          user: {
            ...user,
            user_metadata: {
              ...user.user_metadata,
              full_name: user.user_metadata?.full_name || '',
              avatar_url: user.user_metadata?.avatar_url || undefined,
            },
            email: user.email || '',
          },
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || undefined,
        };
        
        setAuthState(prev => ({
          ...prev,
          session,
          isLoading: false,
          error: null,
        }));
        
        // Schedule next refresh before token expires (80% of token lifetime)
        // Supabase's session.expires_at is in SECONDS since epoch; convert to ms
        const expiresAt = (session.expires_at ? session.expires_at * 1000 : 0);
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;
        const refreshTime = Math.max(0, timeUntilExpiry * 0.8); // Refresh at 80% of token lifetime
        
        // Clear any existing refresh timeout
        if (sessionRefreshTimeoutRef.current) {
          clearTimeout(sessionRefreshTimeoutRef.current);
        }
        
        // Set new refresh timeout
        sessionRefreshTimeoutRef.current = setTimeout(() => {
          refreshSession().catch(console.error);
        }, refreshTime);
        
        return session;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh session';
      
      // If refresh fails, try again after a delay (exponential backoff)
      if (refreshRetryCount.current < 3) {
        const delay = Math.min(1000 * Math.pow(2, refreshRetryCount.current), 30000);
        refreshRetryCount.current++;
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return refreshSession();
      }
      
      // After max retries, sign out
      refreshRetryCount.current = 0;
      setAuthState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      
      // Sign out if refresh keeps failing
      await handleSignOut();
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Check for existing session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          // Attempt to refresh the session on error
          const refreshedSession = await refreshSession();
          if (!refreshedSession) {
            throw error;
          }
          return;
        }
        
        if (data?.session) {
          const user = data.session.user as AppUser;
          const appSession: AppSession = {
            ...data.session,
            user: {
              ...user,
              user_metadata: {
                ...user.user_metadata,
                full_name: user.user_metadata?.full_name || '',
                avatar_url: user.user_metadata?.avatar_url || undefined,
              },
              email: user.email || '',
            },
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.avatar_url || undefined,
          };
          
          setAuthState({
            session: appSession,
            isLoading: false,
            error: null,
          });
        } else {
          setAuthState({
            ...initialAuthState,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState({
          ...initialAuthState,
          error: error instanceof Error ? error.message : 'Failed to initialize auth',
          isLoading: false,
        });
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        debug('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          const user = session.user as AppUser;
          const appSession: AppSession = {
            ...session,
            user: {
              ...user,
              user_metadata: {
                ...user.user_metadata,
                full_name: user.user_metadata?.full_name || '',
                avatar_url: user.user_metadata?.avatar_url || undefined,
              },
              email: user.email || '',
            },
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.avatar_url || undefined,
          };
          
          setAuthState(prev => ({
            ...prev,
            session: appSession,
            isLoading: false,
            error: null,
          }));
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            ...initialAuthState,
            isLoading: false,
            error: null,
          });
        }
      }
    );
    
    // Cleanup
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      
      // Clear any pending refresh timeouts
      if (sessionRefreshTimeoutRef.current) {
        clearTimeout(sessionRefreshTimeoutRef.current);
      }
    };
  }, [refreshSession]);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      debug('Signing in with email:', email);
      setLoading(true);
      
      // Clear any previous errors and reset state
      setAuthState({
        ...initialAuthState,
        isLoading: true,
      });
      
      // Sign in with email and password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        throw signInError;
      }
      
      if (!data.session) {
        throw new Error('No session returned after sign in');
      }
      
      debug('Sign in successful, session:', data.session);
      
      // The auth state change listener will handle updating the state
      // We'll wait a moment to ensure the listener has processed the change
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Return success - the auth state listener will handle the state update
      return { 
        data: {
          ...data.session,
          user: data.session.user as AppUser,
          id: data.session.user.id,
          email: data.session.user.email || '',
          full_name: data.session.user.user_metadata?.full_name || '',
        }, 
        error: null 
      };
      
    } catch (error) {
      console.error('Error signing in:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      
      // Reset state on error
      setAuthState({
        ...initialAuthState,
        error: errorMessage,
        isLoading: false,
      });
      
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error(errorMessage) 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      debug('Signing up with email:', email);
      setLoading(true);
      
      // First, sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
      
      if (signUpError) {
        throw signUpError;
      }
      
      if (!data?.user) {
        throw new Error('No user data returned after sign up');
      }
      
      // After successful signup, sign in the user
      const signInResult = await signIn(email, password);
      
      if (signInResult.error) {
        throw signInResult.error;
      }
      
      return signInResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
      setAuthState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      return { data: null, error: error instanceof Error ? error : new Error(errorMessage) };
    } finally {
      setLoading(false);
    }
  }, [signIn]);

  // Sign out function with cleanup
  const handleSignOut = useCallback(async (): Promise<{ error: Error | null }> => {
    try {
      setLoading(true);
      
      // Clear any existing timeouts
      setAuthState(prev => ({
        ...prev,
        error: null,
        session: null,
        isLoading: false
      }));
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        debug('Error signing out:', error);
        throw error;
      }
      
      // Clear the auth state
      debug('Sign out successful, clearing auth state');
      setAuthState({
        ...initialAuthState,
        isLoading: false,
      });
      
      // Clear any cached data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sb-auth-token');
        localStorage.removeItem('sb-auth-token-2');
      }
      
      // Use Next.js router for client-side navigation
      router.push('/login');
      
      // This return won't be reached due to the redirect, but TypeScript needs it
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return handleAuthError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle errors in the auth context
  const handleAuthError = (error: unknown) => {
    console.error('Auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    setAuthState(prev => ({
      ...prev,
      error: errorMessage,
      isLoading: false,
    }));
    return { error: new Error(errorMessage) };
  };

  const contextValue = useMemo(() => ({
    user: authState.session?.user || null,
    loading: loading || authState.isLoading,
    error: authState.error,
    signIn,
    signUp,
    signOut: handleSignOut,
  }), [authState.session?.user, authState.isLoading, authState.error, loading, signIn, signUp, handleSignOut]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
