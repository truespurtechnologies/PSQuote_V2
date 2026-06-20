'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
// import { initializeSupabaseServices } from '../lib/supabase/init';

export function Providers({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const init = async () => {
      try {
        // await initializeSupabaseServices();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize Supabase services:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize application'));
      }
    };

    init();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-red-50 rounded-lg shadow">
          <h2 className="text-xl font-bold text-red-800 mb-2">Initialization Error</h2>
          <p className="text-red-700 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
