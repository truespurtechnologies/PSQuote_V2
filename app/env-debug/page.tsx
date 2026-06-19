'use client';

import { useEffect, useState } from 'react';

export default function EnvDebugPage() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Collect all environment variables that start with NEXT_PUBLIC_
    const publicEnvVars: Record<string, string> = {};
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_')) {
        publicEnvVars[key] = process.env[key] || 'undefined';
      }
    });
    
    setEnvVars(publicEnvVars);
  }, []);

  if (!isClient) {
    return <div>Loading environment variables...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Debug</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Process Environment</h2>
        <div className="space-y-2">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="border-b border-gray-100 pb-2">
              <div className="font-mono text-sm bg-gray-50 p-2 rounded">
                <span className="text-blue-600">{key}</span> = 
                <span className="text-green-600">"{value}"</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-8 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Supabase Client Status</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Supabase URL:</h3>
            <div className="font-mono text-sm bg-gray-50 p-2 rounded overflow-x-auto">
              {process.env.NEXT_PUBLIC_SUPABASE_URL || 
                <span className="text-red-600">Not defined</span>}
            </div>
          </div>
          <div>
            <h3 className="font-medium">Supabase Anon Key:</h3>
            <div className="font-mono text-sm bg-gray-50 p-2 rounded overflow-x-auto">
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
                `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10)}...` : 
                <span className="text-red-600">Not defined</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
