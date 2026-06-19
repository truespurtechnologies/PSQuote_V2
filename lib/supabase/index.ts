// Re-export everything from the client
export * from './client';

// This is the preferred way to import the Supabase client
// import { supabase } from '@/lib/supabase';

// For backward compatibility
export { default } from './client';

// Type exports
export type { Database } from '../types/supabase';

export * from '@supabase/supabase-js';

// Helper function to get the Supabase client with type safety
export const getSupabase = () => {
  // Use a dynamic import to avoid circular dependencies
  const { supabase } = require('./client');
  return supabase;
};

// Log a deprecation warning for the old browser-client
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  if ((window as any).__SUPABASE_CLIENT_LOADED__) {
    console.warn(
      'Multiple Supabase client instances detected. ' +
      'Please use `import { supabase } from \'@/lib/supabase\'` ' +
      'instead of creating new client instances.'
    );
  } else {
    (window as any).__SUPABASE_CLIENT_LOADED__ = true;
  }
}
