/**
 * @deprecated This file is deprecated. Please use `@/lib/supabase/client` instead.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../types/supabase';

// Create a single supabase client for the entire app
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * @deprecated Use `import { supabase } from '@/lib/supabase/client'` instead.
 */
export function createClient() {
  console.warn(
    'The `createClient` function from `@/lib/supabase/browser-client` is deprecated. ' +
    'Please use `import { supabase } from \'@/lib/supabase/client\'` instead.'
  );

  // If we're in the browser and we've already created a client, return it
  if (typeof window !== 'undefined' && browserClient) {
    return browserClient;
  }

  // Create a browser supabase client instance.
  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
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
      },
    }
  );

  // Store the client for subsequent calls
  if (typeof window !== 'undefined') {
    browserClient = client;
  }

  return client;
}
