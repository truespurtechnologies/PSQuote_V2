'use client';

export default function DebugPage() {
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Debug Disabled</h1>
          <p>This debug page is disabled in production.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
        <p>This is a simple debug page to test if the app is working.</p>
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p className="font-mono text-sm">
            Environment: {process.env.NODE_ENV}
          </p>
        </div>
      </div>
    </div>
  );
}
