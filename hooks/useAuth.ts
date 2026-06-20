'use client';

import { useState, useEffect, useCallback, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getCurrentSession, refreshSession } from '@/lib/supabase-client';
import { AuthState, initialAuthState, authReducer, AppSession, AppUser } from '@/types/auth';

// Helper function to convert UserProfile to AppSession
function convertToAppSession(userProfile: any): AppSession | null {
  if (!userProfile) return null;
  
  // Create a minimal AppUser object with all required fields
  const user: AppUser = {
    id: userProfile.id || '',
    email: userProfile.email || null,
    phone: userProfile.phone || null,
    aud: 'authenticated',
    role: 'authenticated',
    is_anonymous: false,
    app_metadata: {},
    user_metadata: {
      full_name: userProfile.full_name || undefined,
      avatar_url: userProfile.avatar_url || undefined,
      ...(userProfile.user_metadata || {})
    },
    created_at: userProfile.created_at || new Date().toISOString(),
    updated_at: userProfile.updated_at || new Date().toISOString(),
    email_confirmed_at: userProfile.email_confirmed_at || null,
    confirmation_sent_at: userProfile.confirmation_sent_at || null,
    confirmed_at: userProfile.confirmed_at || null,
    last_sign_in_at: userProfile.last_sign_in_at || null,
    identities: userProfile.identities || []
  };

  // Create the AppSession object
  return {
    user,
    access_token: '',
    refresh_token: '',
    expires_in: 3600,
    token_type: 'bearer',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    provider_token: null,
    provider_refresh_token: null,
    // Add user properties at the root level for backward compatibility
    id: userProfile.id,
    email: userProfile.email || undefined,
    full_name: userProfile.full_name || undefined,
    avatar_url: userProfile.avatar_url || undefined,
  };
}

const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const useAuth = (requireAuth = true) => {
  const router = useRouter();
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const { session, isLoading, error } = state;

  const setSession = useCallback((session: AppSession | null) => {
    dispatch({ type: 'SET_SESSION', payload: session });
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: isLoading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const checkAndRefreshSession = useCallback(async () => {
    try {
      setLoading(true);
      const userProfile = await getCurrentSession();
      
      if (!userProfile) {
        if (requireAuth) {
          router.push('/');
        }
        return null;
      }

      // Type guard to check if the session has a user property
      const isSessionWithUser = (session: any): session is { user: any } => {
        return session && typeof session === 'object' && 'user' in session;
      };

      // Safely extract user data from the session
      const sessionData = isSessionWithUser(userProfile) ? userProfile : { user: userProfile };
      const userData = sessionData.user || {};
      const userMetadata = userData.user_metadata || {};

      // Create a properly typed user object
      const user: AppUser = {
        id: userData.id || '',
        email: userData.email || null,
        phone: userData.phone || null,
        aud: 'authenticated',
        role: 'authenticated',
        is_anonymous: false,
        app_metadata: userData.app_metadata || {},
        user_metadata: {
          full_name: userMetadata.full_name || undefined,
          avatar_url: userMetadata.avatar_url || undefined,
          ...userMetadata
        },
        created_at: userData.created_at || new Date().toISOString(),
        updated_at: userData.updated_at || new Date().toISOString(),
        email_confirmed_at: userData.email_confirmed_at || null,
        confirmation_sent_at: userData.confirmation_sent_at || null,
        confirmed_at: userData.confirmed_at || null,
        last_sign_in_at: userData.last_sign_in_at || null,
        identities: []
      };

      // Create the session object with all required properties
      const session: AppSession = {
        id: user.id,
        access_token: (sessionData as any).access_token || '',
        refresh_token: (sessionData as any).refresh_token || '',
        expires_in: (sessionData as any).expires_in || 3600,
        token_type: (sessionData as any).token_type || 'bearer',
        expires_at: (sessionData as any).expires_at || Math.floor(Date.now() / 1000) + 3600,
        provider_token: (sessionData as any).provider_token || null,
        provider_refresh_token: (sessionData as any).provider_refresh_token || null,
        user,
        // Add user properties at the root level for backward compatibility
        email: user.email || undefined,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url
      };

      setSession(session);
      setError(null);
      return session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify session';
      console.error('Session check error:', errorMessage);
      setError('Failed to verify your session. Please log in again.');
      
      if (requireAuth) {
        router.push('/');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [requireAuth, router, setError, setLoading, setSession]);

  // Handle auth state changes
  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;
    let refreshInterval: NodeJS.Timeout | null = null;

    const handleAuthChange = async (event: string, session: any) => {
      if (!isMounted) return;
      
      console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
      
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          if (session) {
            // Ensure we have the latest session data
            const currentSession = await getCurrentSession();
            if (currentSession) {
              const appSession = convertToAppSession(currentSession);
              setSession(appSession);
              setError(null);
            }
          }
          break;
          
        case 'SIGNED_OUT':
          setSession(null);
          if (requireAuth) {
            // Use client-side navigation to avoid full page reload
            if (window.location.pathname !== '/') {
              router.push('/');
            }
          }
          break;
          
        default:
          break;
      }
    };

    // Set up the auth state change listener
    subscription = supabase.auth.onAuthStateChange(handleAuthChange).data.subscription;

    // Initial session check
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const currentSession = await getCurrentSession();
        
        if (currentSession) {
          const appSession = convertToAppSession(currentSession);
          setSession(appSession);
          setError(null);
        } else if (requireAuth && window.location.pathname !== '/') {
          router.push('/');
        }
      } catch (error) {
        console.error('Initial auth check failed:', error);
        setError('Failed to check authentication status');
        if (requireAuth && window.location.pathname !== '/') {
          router.push('/');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // DISABLED: Session refresh interval causes page reloads when switching tabs
    // The enhanced auth context handles session refresh automatically via Supabase's autoRefreshToken
    // refreshInterval = setInterval(async () => {
    //   try {
    //     if (isMounted) {
    //       await refreshSession();
    //     }
    //   } catch (error) {
    //     console.error('Session refresh error:', error);
    //   }
    // }, SESSION_REFRESH_INTERVAL);

    // Cleanup
    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [requireAuth, setError, setLoading, setSession, router]);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setSession(null);
      router.push('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      console.error('Sign out error:', errorMessage);
      setError('Failed to sign out. Please try again.');
      setLoading(false);
    }
  };

  return {
    session,
    isLoading,
    error,
    signOut,
    refreshSession: checkAndRefreshSession,
  };
};
