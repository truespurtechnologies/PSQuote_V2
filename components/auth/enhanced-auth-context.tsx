'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { log } from '@/lib/logger';

// Import the Database type from the generated types
import type { Database } from '@/lib/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Create a properly typed Supabase client instance
const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase client is not properly initialized');
  }
  return supabase as unknown as SupabaseClient;
};

// Initialize the client
const supabaseClient = getSupabaseClient();

// Types
export type AppUser = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl?: string | null;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AppSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  user: AppUser;
  id: string;
  email: string;
  full_name: string;
};

// Extend the Session type to include our custom fields
type ExtendedSession = Session & {
  id: string;
  email: string;
  full_name: string;
};

// Debug function for auth context
const debug = (message: string, ...args: unknown[]) => {
  log.debug(`Auth Context: ${message}`, { args });
};

// Constants
const MAX_RETRIES = 3;
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes
const SESSION_CHECK_INTERVAL = 60 * 1000; // 1 minute

// Auth state
type AuthState = {
  user: AppUser | null;
  session: AppSession | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  lastError: Error | null;
};

// Auth actions
type AuthAction =
  | { type: 'INITIALIZE'; payload: { user: AppUser | null; session: AppSession | null } }
  | { type: 'SIGN_IN'; payload: { user: AppUser; session: AppSession } }
  | { type: 'SIGN_UP'; payload: { user: AppUser; session: AppSession } }
  | { type: 'SIGN_OUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'REFRESH_SESSION'; payload: { session: AppSession } }
  | { type: 'SET_SESSION'; payload: { session: AppSession; user: AppUser } };

// Auth response type
type AuthResponse = {
  data: { 
    user: AppUser | null; 
    session: AppSession | null;
  };
  error: Error | null;
};

// Type guard to check if session is AppSession
function isAppSession(session: any): session is AppSession {
  return session && 
         typeof session === 'object' &&
         'id' in session &&
         'email' in session &&
         'full_name' in session;
}

// Type guard to check if user is AppUser
function isAppUser(user: any): user is AppUser {
  return user && 
         typeof user === 'object' &&
         'id' in user &&
         'email' in user &&
         'fullName' in user;
}

// Auth context type
type AuthContextType = {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<AuthResponse>;
};

// Initial state
const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  error: null,
  initialized: false,
  lastError: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        loading: false,
        initialized: true,
      };
    case 'SIGN_IN':
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        error: null,
        loading: false,
      };
    case 'SIGN_OUT':
      return {
        ...state,
        user: null,
        session: null,
        error: null,
        loading: false,
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'REFRESH_SESSION':
      return {
        ...state,
        session: action.payload.session,
        error: null,
        loading: false,
      };
    case 'SET_SESSION':
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        error: null,
        loading: false,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
type AuthProviderProps = {
  children: React.ReactNode;
};

// Helper function to map Supabase user to our AppUser
export function mapToAppUser(user: User | null): AppUser | null {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email || '',
    fullName: user.user_metadata?.full_name || null,
    avatarUrl: user.user_metadata?.avatar_url || null,
    role: user.user_metadata?.role || 'user',
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

// Helper function to map Supabase session to our AppSession
export function mapToAppSession(session: Session | null): AppSession | null {
  if (!session) return null;
  
  const user = mapToAppUser(session.user);
  if (!user) return null;

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token || '',
    expires_at: session.expires_at || Math.floor(Date.now() / 1000) + 3600,
    expires_in: session.expires_in || 3600,
    token_type: session.token_type || 'bearer',
    user,
    id: session.user.id,
    email: session.user.email || '',
    full_name: user.fullName || '',
  };
}

export function EnhancedAuthProvider({ children }: AuthProviderProps) {
  // State for client initialization error
  const [clientError, setClientError] = useState<Error | null>(null);
  
  // Initialize the client in an effect to handle potential errors
  useEffect(() => {
    try {
      // Access the client to trigger any potential initialization errors
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Failed to initialize Supabase client');
      }
      setClientError(null);
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      setClientError(error instanceof Error ? error : new Error('Failed to initialize Supabase client'));
    }
  }, []);

  // Show error message if client initialization failed
  if (clientError) {
    return (
      <div className="p-4 text-red-500">
        <h2 className="text-xl font-bold mb-2">Authentication Error</h2>
        <p>Failed to initialize authentication service. Please try refreshing the page.</p>
        <p className="text-sm mt-2">Error: {clientError.message}</p>
      </div>
    );
  }
  const router = useRouter();
  const { toast } = useToast();
  const [state, dispatch] = useReducer(authReducer, initialState);
  const isMounted = useRef(true);
  const subscription = useRef<{ unsubscribe: () => void } | null>(null);
  const isRedirecting = useRef(false);

  // Memoize dispatch to prevent unnecessary re-renders
  const stableDispatch = useCallback(dispatch, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (subscription.current) {
      subscription.current.unsubscribe();
      subscription.current = null;
    }
  }, []);

  // Handle auth state changes - NO automatic redirects to prevent tab switch issues
  const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
    if (!isMounted.current) return;

    try {
      log.debug('Auth state changed', { 
        event, 
        hasSession: !!session,
        userId: session?.user?.id 
      });
      const appSession = mapToAppSession(session);
      const user = appSession?.user || null;

      if (event === 'SIGNED_IN' && user && appSession) {
        log.info('User signed in', { userId: user.id });
        stableDispatch({ type: 'SIGN_IN', payload: { user, session: appSession } });
        // NO automatic redirect - let components/middleware handle routing
      } else if (event === 'SIGNED_OUT') {
        log.info('User signed out');
        stableDispatch({ type: 'SIGN_OUT' });
        router.push('/login');
      } else if (event === 'TOKEN_REFRESHED' && appSession) {
        log.debug('Token refreshed');
        stableDispatch({ type: 'REFRESH_SESSION', payload: { session: appSession } });
      } else if (event === 'USER_UPDATED' && user && appSession) {
        log.debug('User updated');
        stableDispatch({ type: 'SET_SESSION', payload: { user, session: appSession } });
      }
    } catch (error) {
      console.error('Error handling auth state change:', error);
      stableDispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  }, [router, stableDispatch]);

  // Note: Removed redundant visibilitychange and storage listeners
  // Supabase SSR already handles cross-tab sync and session refresh automatically

  // Set up the auth state change listener
  useEffect(() => {
    if (typeof window === 'undefined' || !supabaseClient?.auth) return;

    const { data: { subscription: authSubscription } } = supabaseClient.auth.onAuthStateChange(handleAuthStateChange);
    subscription.current = authSubscription;

    const checkInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) throw error;

        if (session) {
          const appUser = mapToAppUser(session.user);
          const appSession = {
            ...session,
            user: appUser,
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || '',
          } as AppSession;

          dispatch({
            type: 'INITIALIZE',
            payload: { user: appUser, session: appSession },
          });
        } else {
          dispatch({
            type: 'INITIALIZE',
            payload: { user: null, session: null },
          });
        }
      } catch (error) {
        console.error('Error checking initial session:', error);
        dispatch({
          type: 'INITIALIZE',
          payload: { user: null, session: null },
        });
      }
    };

    checkInitialSession();

    return () => {
      cleanup();
    };
  }, [supabaseClient, handleAuthStateChange, cleanup]);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    try {
      // Input validation
      if (!email || !password) {
        const error = new Error('Email and password are required');
        error.name = 'ValidationError';
        throw error;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null }); // Clear previous errors

      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        // Handle Supabase auth errors
        if (error) {
          // Map common Supabase auth errors to user-friendly messages
          let userFriendlyMessage = 'The email or password you entered is incorrect';
          
          if (error.message.includes('Email not confirmed')) {
            userFriendlyMessage = 'Please verify your email before signing in';
          } else if (error.message.includes('Too many requests')) {
            userFriendlyMessage = 'Too many login attempts. Please try again later.';
          }
          
          // Return the error without throwing to prevent unhandled promise rejections
          return {
            data: { user: null, session: null },
            error: new Error(userFriendlyMessage)
          };
        }

        if (!data.session || !data.user) {
          return {
            data: { user: null, session: null },
            error: new Error('No session or user data returned')
          };
        }

        const appSession = mapToAppSession(data.session);
        const user = mapToAppUser(data.user);

        if (!appSession || !user) {
          return {
            data: { user: null, session: null },
            error: new Error('Failed to process your account information')
          };
        }

        // Update the auth state with the new session
        dispatch({
          type: 'SIGN_IN',
          payload: { user, session: appSession },
        });

        // Return the session data - let the component handle the navigation
        return {
          data: { user, session: appSession },
          error: null,
        };
      } catch (error) {
        console.error('Sign in error:', error);
        return {
          data: { user: null, session: null },
          error: error instanceof Error 
            ? error 
            : new Error('An unexpected error occurred during sign in')
        };
      }

    } catch (error) {
      console.error('Unexpected error in signIn:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      // Update the UI with the error message
      dispatch({ 
        type: 'SET_ERROR', 
        payload: errorMessage 
      });
      
      return { 
        data: { user: null, session: null }, 
        error: error instanceof Error ? error : new Error(errorMessage)
      };
    } finally {
      if (isMounted.current) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, []);

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string, fullName: string): Promise<AuthResponse> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      if (!data.user) {
        throw new Error('No user data returned from sign up');
      }

      // Create a minimal session for the new user
      const tempSession: AppSession = {
        access_token: '',
        refresh_token: '',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: data.user.id,
          email: email,
          fullName: fullName,
        },
        id: data.user.id,
        email: email,
        full_name: fullName,
      };

      const appUser = mapToAppUser(data.user);
      
      if (appUser) {
        dispatch({
          type: 'SIGN_UP',
          payload: { user: appUser, session: tempSession },
        });
      }

      return {
        data: { 
          user: appUser, 
          session: tempSession 
        },
        error: null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { 
        data: { user: null, session: null }, 
        error: error instanceof Error ? error : new Error(errorMessage) 
      };
    } finally {
      if (isMounted.current) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, []);

  // Sign out
  const signOut = useCallback(async (): Promise<{ error: Error | null }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const { error } = await supabaseClient.auth.signOut({ scope: 'local' });

      if (error) throw error;

      dispatch({ type: 'SIGN_OUT' });

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { error: new Error(errorMessage) };
    } finally {
      if (isMounted.current) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, [router]);

  // Refresh session implementation - simplified, relies on Supabase autoRefreshToken
  const refreshSession = useCallback(async (): Promise<AuthResponse> => {
    if (!supabaseClient?.auth) {
      const error = new Error('Auth client not available');
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { data: { user: null, session: null }, error };
    }

    try {
      // Just get the current session - Supabase handles refresh automatically
      const { data, error } = await supabaseClient.auth.getSession();
      if (error) throw error;
      
      const session = data?.session;
      if (!session) {
        throw new Error('No session found');
      }

      const appSession = mapToAppSession(session);
      const user = mapToAppUser(session.user);

      if (appSession && user) {
        dispatch({
          type: 'REFRESH_SESSION',
          payload: { session: appSession },
        });
      }

      return {
        data: { 
          user: user, 
          session: appSession 
        },
        error: null,
      };
    } catch (error) {
      console.error('Error getting session:', error);
      return { 
        data: { user: null, session: null }, 
        error: error instanceof Error ? error : new Error('Failed to get session') 
      };
    }
  }, [supabaseClient]);

  // Memoize the context value
  const contextValue = useMemo<AuthContextType>(() => ({
    state,
    signIn,
    signUp,
    signOut,
    refreshSession,
  }), [state, signIn, signUp, signOut, refreshSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      cleanup();
    };
  }, []);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Auth hook
// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
