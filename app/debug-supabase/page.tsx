'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/client';

export default function DebugSupabase() {
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Supabase Debug</h1>
        <p>This page is disabled in production.</p>
      </div>
    );
  }
  const [envVars, setEnvVars] = useState<{
    NEXT_PUBLIC_SUPABASE_URL: string | undefined;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string | undefined;
  }>({
    NEXT_PUBLIC_SUPABASE_URL: undefined,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
  });

  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check environment variables
    setEnvVars({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });

    // Check if Supabase client is initialized
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(data.session);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Debug Information</h1>
      
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-3">Environment Variables</h2>
        <pre className="bg-white p-4 rounded overflow-x-auto">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>

      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-3">Session Status</h2>
        <div className="bg-white p-4 rounded">
          <pre>{session ? JSON.stringify(session, null, 2) : 'No active session'}</pre>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          <h3 className="font-semibold">Error:</h3>
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      )}
    </div>
  );
}
