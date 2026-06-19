import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

// User type based on the database schema
type User = Database['public']['Tables']['users']['Row'];

// Extended user type with required fields
export type AppUser = User & {
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
};

// Create a new Supabase client for server-side operations
const createServerClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing required environment variables for Supabase');
  }
  
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false, // Don't persist session in server components
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
};

// For server-side operations, create a new client each time
const getServerClient = () => createServerClient();

export type AuthResponse = {
  user: AppUser | null;
  session: any | null;
  error: Error | null;
};

// Helper to get the Supabase client with proper typing
const getClient = () => {
  return getServerClient();
};

// Async version for async contexts
const getClientAsync = async () => {
  return getServerClient();
};

// Debug function for auth utils
const debug = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Auth Utils] ${message}`, ...args);
  }
};

const mapToAppUser = (user: any): AppUser => {
  return {
    id: user.id,
    email: user.email || null,
    full_name: user.user_metadata?.full_name || null,
    avatar_url: user.user_metadata?.avatar_url || null,
    created_at: user.created_at || new Date().toISOString(),
    updated_at: user.updated_at || new Date().toISOString(),
    ...user.user_metadata
  };
};

export async function signInWithEmail(email: string, password: string) {
  const supabase = getServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const supabase = getServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  try {
    const supabase = getServerClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error.message);
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  const supabase = getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user as AppUser | null;
}

export async function getSession() {
  try {
    const supabase = getServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    return { 
      session, 
      user: session?.user || null, 
      error: null 
    };
  } catch (error) {
    debug('Error in getSession:', error);
    return { 
      session: null, 
      user: null,
      error: error instanceof Error ? error : new Error('Failed to get session') 
    };
  }
}

export const resetPassword = async (email: string): Promise<{ 
  data: any | null; 
  error: Error | null 
}> => {
  const supabase = getServerClient();
  
  try {
    debug('Initiating password reset for email:', email);
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      debug('Password reset error:', error);
      return { data: null, error };
    }

    debug('Password reset email sent successfully');
    return { data, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error : new Error('Failed to reset password');
    debug('Unexpected error in resetPassword:', errorMessage);
    return { data: null, error: errorMessage };
  }
};

export const updatePassword = async (newPassword: string): Promise<{ error: Error | null }> => {
  const supabase = getServerClient();
  
  try {
    debug('Updating user password');
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      debug('Password update error:', error);
      return { error };
    }

    debug('Password updated successfully');
    return { error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error : new Error('Failed to update password');
    debug('Unexpected error in updatePassword:', errorMessage);
    return { error: errorMessage };
  }
};
