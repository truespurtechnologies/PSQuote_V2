'use client';

import { useEffect, useState } from 'react';
import env from '../../src/env';

export default function EnvTestPage() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Loading environment variables...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Test</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Client-side Environment Variables:</h2>
        <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
          {JSON.stringify({
            NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not Set',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
              ? '✅ Set (key exists)' 
              : '❌ Not Set',
            NODE_ENV: env.NODE_ENV || 'development'
          }, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Process Environment (for debugging):</h2>
        <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
          {JSON.stringify({
            'process.env.NEXT_PUBLIC_SUPABASE_URL': typeof window !== 'undefined' 
              ? process.env.NEXT_PUBLIC_SUPABASE_URL 
                ? '✅ Set (but may not be accessible in browser)' 
                : '❌ Not accessible in browser'
              : 'Server-side only',
            'process.env.NODE_ENV': process.env.NODE_ENV
          }, null, 2)}
        </pre>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400">
        <p className="font-medium">Note about environment variables in Next.js:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Client-side environment variables must be prefixed with <code>NEXT_PUBLIC_</code></li>
          <li>Environment variables are embedded during build time, not runtime</li>
          <li>After changing <code>.env</code> files, you must restart the dev server</li>
        </ul>
      </div>
    </div>
  );
}
