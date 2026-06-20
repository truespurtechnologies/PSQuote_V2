import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

// Debug function
const debug = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Supabase Client] ${message}`, ...args);
  }
};

// Define the expected environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Singleton instance
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

// Create a simple client with consistent configuration
const createClient = () => {
  // Return existing instance if available (singleton pattern)
  if (clientInstance) {
    return clientInstance;
  }

  // In development, preserve instance across hot reloads
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const win = window as any;
    if (win.__supabaseClient) {
      clientInstance = win.__supabaseClient;
      return clientInstance;
    }
  }

  debug('Creating new Supabase client instance');
  
  const client = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        // Don't specify custom storage - let Supabase handle cookies automatically
        // This ensures server-side middleware can read the session
      },
    }
  );

  clientInstance = client;

  // Store in window for development hot reload persistence
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).__supabaseClient = client;
  }

  return client;
};

// Create and export the Supabase client singleton
export const supabase = createClient();
export default supabase;
