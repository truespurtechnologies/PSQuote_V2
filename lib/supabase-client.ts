import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';
import { AppSession } from '@/types/auth';

// Re-export Database type for consistency
export type { Database };

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'fatal';
type LogContext = Record<string, unknown>;

// User profile type for our application
interface UserProfile {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  updated_at?: string;
  created_at?: string;
  is_active?: boolean | null;
  phone?: string | null;
  role?: string;
  username?: string;
  website?: string | null;
  [key: string]: any; // Allow additional properties
}

/**
 * Custom error class for Supabase client errors
 */
class SupabaseClientError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'SupabaseClientError';
    
    // Capture stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SupabaseClientError);
    }
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      stack: this.stack,
      originalError: this.originalError
    };
  }
}

/**
 * Helper function to normalize errors
 */
function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  
  if (typeof error === 'string') {
    return new Error(error);
  }
  
  return new Error('An unknown error occurred');
}

/**
 * Structured logger function for consistent logging across the application
 */
function logger(
  level: LogLevel, 
  message: string, 
  context: LogContext = {},
  error?: unknown
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...context,
    ...(error ? { error: error instanceof Error ? error.message : String(error) } : {})
  };
  
  // In production, use structured logging
  if (process.env.NODE_ENV === 'production') {
    const consoleMethod = level === 'fatal' ? 'error' : level;
    console[consoleMethod](JSON.stringify(logEntry));
    return;
  }
  
  // In development, use more readable console output
  const color = {
    info: '\x1b[36m', // Cyan
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    debug: '\x1b[35m', // Magenta
    fatal: '\x1b[31;1m' // Bright Red
  }[level];
  
  // For fatal errors, always log to console.error regardless of level
  const consoleMethod = level === 'fatal' ? 'error' : level;
  
  const reset = '\x1b[0m';
  console[consoleMethod](`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${reset}`);
  
  if (Object.keys(context).length > 0) {
    console[consoleMethod](`${color}Context: ${JSON.stringify(context, null, 2)}${reset}`);
  }
  
  if (error) {
    console[consoleMethod](`${color}Error: ${error instanceof Error ? error.stack : String(error)}${reset}`);
  }
}

/**
 * Creates a Supabase client with proper type safety and error handling
 */
function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Validate environment variables
  const missingVars = [
    !supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
    !supabaseAnonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ].filter(Boolean);
  
  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
    const error = new SupabaseClientError(
      errorMessage,
      'MISSING_ENV_VARS',
      500
    );
    
    logger('error', 'Failed to initialize Supabase client', {}, error);
    throw error;
  }
  
  // Validate Supabase URL format
  try {
    new URL(supabaseUrl!);
  } catch (error) {
    const errorMessage = `Invalid Supabase URL: ${supabaseUrl}`;
    const clientError = new SupabaseClientError(
      errorMessage,
      'INVALID_SUPABASE_URL',
      500,
      error
    );
    
    logger('error', 'Failed to initialize Supabase client', {}, clientError);
    throw clientError;
  }
  
  // Validate Supabase anon key format (JWT)
  const jwtRegex = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
  if (!jwtRegex.test(supabaseAnonKey!)) {
    const errorMessage = 'Invalid Supabase anon key format. Expected a JWT token.';
    const clientError = new SupabaseClientError(
      errorMessage,
      'INVALID_SUPABASE_ANON_KEY',
      500
    );
    
    logger('error', 'Failed to initialize Supabase client', {}, clientError);
    throw clientError;
  }
  
  // Create the Supabase client with enhanced session handling
  return createBrowserClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // Always true to handle auth redirects
        flowType: 'pkce',
        storage: {
          getItem: (key: string) => {
            if (typeof window === 'undefined') return null;
            return localStorage.getItem(key);
          },
          setItem: (key: string, value: string) => {
            if (typeof window === 'undefined') return;
            localStorage.setItem(key, value);
          },
          removeItem: (key: string) => {
            if (typeof window === 'undefined') return;
            localStorage.removeItem(key);
          },
        },
        storageKey: 'sb-auth-token',
        debug: !isProduction,
      },
      global: {
        headers: {
          'X-Client-Info': 'pop-quotation-generator/1.0.0',
        },
      },
    }
  );
}

// Session type for our application
interface Session {
  user: UserProfile;
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
  expires_at?: number;
}

// Global variable to hold the singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null;
let isInitializing = false;
const cleanupCallbacks: Array<() => void> = [];

/**
 * Get or create the singleton Supabase client instance
 */
function initializeSupabaseClient(): ReturnType<typeof createClient> {
  // In development, use the global variable to preserve the instance during hot reloads
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/no-explicit-any
    const win = window as any;
    if (win.__supabase) {
      return win.__supabase;
    }
  }

  // Return existing instance if available
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Prevent multiple initializations
  if (isInitializing) {
    throw new Error('Supabase client is already being initialized');
  }

  isInitializing = true;
  
  try {
    // Create new client instance
    const client = createClient();
    
    // Store the instance
    supabaseInstance = client;
    
    // In development, store the instance in the window object
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__supabase = client;
    }
    
    logger('info', 'Supabase client initialized');
    return client;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger('error', 'Failed to initialize Supabase client', { 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Create a dummy client that will throw on use
    const dummyClient = {
      auth: {
        getSession: () => Promise.reject(new Error('Supabase client failed to initialize')),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: () => Promise.reject(new Error('Supabase client failed to initialize')),
        signOut: () => Promise.reject(new Error('Supabase client failed to initialize')),
      },
    } as unknown as ReturnType<typeof createClient>;
    
    // Store the dummy client to prevent repeated initialization attempts
    supabaseInstance = dummyClient;
    return dummyClient;
  } finally {
    isInitializing = false;
  }
}

// Create the client instance when the module loads
const supabaseClient = initializeSupabaseClient();

// Export the singleton instance
export const supabase = supabaseClient;

// For backward compatibility
export function getSupabaseClient(): ReturnType<typeof createClient> {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client can only be used in the browser');
  }
  if (!supabaseInstance) {
    return initializeSupabaseClient();
  }
  return supabaseInstance;
}

// Alias for backward compatibility
export const getSupabaseClientInstance = getSupabaseClient;

/**
 * Sets up automatic session refresh before the token expires
 * @returns Cleanup function to remove the refresh interval
 */
function setupSessionRefresh() {
  const REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes before token expires
  let refreshTimeout: NodeJS.Timeout | null = null;
  let authListener: { unsubscribe: () => void } | null = null;

  const scheduleRefresh = (expiresAt: number) => {
    // Clear any existing timeouts
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }

    const now = Date.now();
    const expiresIn = expiresAt - now;
    
    // Only schedule refresh if the token will expire in the future
    if (expiresIn > 0) {
      // Schedule refresh 5 minutes before expiration (or now if it's closer)
      const refreshIn = Math.max(expiresIn - REFRESH_BUFFER, 0);
      
      refreshTimeout = setTimeout(async () => {
        try {
          const { data, error } = await getSupabaseClient().auth.refreshSession();
          if (error) throw error;
          
          if (data.session) {
            logger('debug', 'Session refreshed successfully');
            // Schedule next refresh
            scheduleRefresh(data.session.expires_at ? data.session.expires_at * 1000 : 0);
          }
        } catch (error) {
          logger('error', 'Failed to refresh session', { error });
          // Retry after a short delay if refresh fails
          refreshTimeout = setTimeout(handleRetry, 30000); // Retry after 30 seconds
        }
      }, refreshIn);
    }
  };

  // Set up auth state change listener
  const { data: { subscription } } = getSupabaseClient().auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.expires_at) {
      scheduleRefresh(session.expires_at * 1000);
    } else if (event === 'SIGNED_OUT') {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        refreshTimeout = null;
      }
    }
  });
  
  authListener = { unsubscribe: () => subscription?.unsubscribe() };

  // Initial setup for current session
  getSupabaseClient().auth.getSession().then(({ data }) => {
    if (data?.session?.expires_at) {
      scheduleRefresh(data.session.expires_at * 1000);
    }
  });
  
  // Handle retry logic with proper typing
  const handleRetry = async () => {
    try {
      const { data } = await getSupabaseClient().auth.getSession();
      if (data?.session?.expires_at) {
        scheduleRefresh(data.session.expires_at * 1000);
      }
    } catch (error) {
      logger('error', 'Failed to get session for retry', { error });
    }
  };

  // Return cleanup function
  return () => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    if (authListener) {
      authListener.unsubscribe();
    }
  };
}

// Initialize session refresh when in browser
if (typeof window !== 'undefined') {
  try {
    const client = getSupabaseClient();
    if (client) {
      const cleanup = setupSessionRefresh();
      if (cleanup) {
        cleanupCallbacks.push(cleanup);
      }
      
      // Cleanup on page unload
      const handleUnload = () => {
        cleanupCallbacks.forEach(cb => {
          try {
            cb();
          } catch (error) {
            logger('error', 'Error during cleanup', { error });
          }
        });
      };
      
      window.addEventListener('beforeunload', handleUnload);
      
      // Cleanup function to remove event listener
      cleanupCallbacks.push(() => {
        window.removeEventListener('beforeunload', handleUnload);
      });
    }
  } catch (error) {
    logger('error', 'Failed to initialize session refresh', { error });
  }
}

// Export the Supabase client as default
export default supabase;

// Export types and utilities
export type { UserProfile, Session };

// Export error handling
export { SupabaseClientError };

// Export logger
export { logger };

// Export utility functions
export { createClient };

// Session management functions
const sessionManagement = {
  /**
   * Gets the current session from Supabase
   * @returns The current session or null if not authenticated
   */
  async getCurrentSession(): Promise<AppSession | null> {
    try {
      const { data: { session }, error } = await getSupabaseClient().auth.getSession();
      if (error) throw error;
      
      if (!session?.user) {
        return null;
      }

      // Map the Supabase session to our AppSession type
      const appSession: AppSession = {
        id: session.user.id,
        access_token: session.access_token || '',
        refresh_token: session.refresh_token || '',
        expires_in: session.expires_in || 3600,
        token_type: session.token_type || 'bearer',
        expires_at: session.expires_at || Math.floor(Date.now() / 1000) + 3600,
        provider_token: session.provider_token || null,
        provider_refresh_token: session.provider_refresh_token || null,
        user: {
          id: session.user.id,
          email: session.user.email || null,
          phone: session.user.phone || null,
          aud: 'authenticated',
          role: 'authenticated',
          is_anonymous: false,
          app_metadata: session.user.app_metadata || {},
          user_metadata: {
            full_name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url,
            ...(session.user.user_metadata || {})
          },
          created_at: session.user.created_at || new Date().toISOString(),
          updated_at: session.user.updated_at || new Date().toISOString(),
          email_confirmed_at: session.user.email_confirmed_at || null,
          confirmation_sent_at: session.user.confirmation_sent_at || null,
          confirmed_at: session.user.confirmed_at || null,
          last_sign_in_at: session.user.last_sign_in_at || null,
          identities: []
        }
      };

      return appSession;
    } catch (error) {
      logger('error', 'Failed to get current session', { error });
      return null;
    }
  },

  /**
   * Refreshes the current session
   * @returns The refreshed session or null if refresh fails
   */
  async refreshSession(): Promise<AppSession | null> {
    try {
      const { data: { session }, error } = await getSupabaseClient().auth.refreshSession();
      if (error) throw error;
      
      if (!session?.user) {
        return null;
      }

      // Map the refreshed session to our AppSession type
      const appSession: AppSession = {
        id: session.user.id,
        access_token: session.access_token || '',
        refresh_token: session.refresh_token || '',
        expires_in: session.expires_in || 3600,
        token_type: session.token_type || 'bearer',
        expires_at: session.expires_at || Math.floor(Date.now() / 1000) + 3600,
        provider_token: session.provider_token || null,
        provider_refresh_token: session.provider_refresh_token || null,
        user: {
          id: session.user.id,
          email: session.user.email || null,
          phone: session.user.phone || null,
          aud: 'authenticated',
          role: 'authenticated',
          is_anonymous: false,
          app_metadata: session.user.app_metadata || {},
          user_metadata: {
            full_name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url,
            ...(session.user.user_metadata || {})
          },
          created_at: session.user.created_at || new Date().toISOString(),
          updated_at: session.user.updated_at || new Date().toISOString(),
          email_confirmed_at: session.user.email_confirmed_at || null,
          confirmation_sent_at: session.user.confirmation_sent_at || null,
          confirmed_at: session.user.confirmed_at || null,
          last_sign_in_at: session.user.last_sign_in_at || null,
          identities: []
        }
      };

      return appSession;
    } catch (error) {
      logger('error', 'Failed to refresh session', { error });
      return null;
    }
  }
};

export const { getCurrentSession, refreshSession } = sessionManagement;
