'use client';

export default function MinimalPage() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Minimal Test Page</h1>
      <p className="text-gray-700">If you can see this, the page is working!</p>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p className="text-sm">
          Environment: {process.env.NODE_ENV}
        </p>
      </div>
    </div>
  );
}
