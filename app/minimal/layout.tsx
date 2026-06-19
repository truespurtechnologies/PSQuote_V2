'use client';

export default function MinimalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  );
}
