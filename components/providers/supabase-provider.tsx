'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Using the singleton Supabase client from @/lib/supabase/client

// Create a context for the Supabase client
export const SupabaseContext = createContext(supabase);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  // This provider now only provides the Supabase client
  // All auth state management is handled by EnhancedAuthProvider

  const value = useMemo(() => supabase, []);

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

// Custom hook to use the Supabase client
export function useSupabase() {
  // On the server, return a dummy client that will be replaced on the client
  if (typeof window === 'undefined') {
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: () => Promise.resolve({ error: null }),
      },
    } as any;
  }
  
  const context = useContext(SupabaseContext);
  if (!context) {
    console.warn('useSupabase was called outside of a SupabaseProvider. This might cause issues with authentication.');
    // Return a dummy client that will be replaced when the real one loads
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: () => Promise.resolve({ error: null }),
      },
    } as any;
  }
  
  return context;
}
