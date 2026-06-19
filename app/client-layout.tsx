'use client';

import { useEffect, useState } from 'react';
import { initializeSupabaseServices } from '@/lib/supabase/init';
import { Toaster } from '@/components/ui/toaster';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeSupabaseServices();
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
      <div className="p-4 bg-red-100 text-red-700">
        <h2 className="font-bold">Initialization Error</h2>
        <p>{error.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
