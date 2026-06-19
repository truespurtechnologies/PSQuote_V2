'use client';

import './globals.css';
import { SupabaseProvider } from '@/components/providers/supabase-provider';
import { EnhancedAuthProvider } from '@/components/auth/enhanced-auth-context';
import ClientLayout from './client-layout';
import { Analytics } from '@vercel/analytics/next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="notion-html">
      <head>
        <link rel="icon" href="/images/popular-steels-logo.png" type="image/png" />
        <link rel="shortcut icon" href="/images/popular-steels-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/popular-steels-logo.png" />
        <meta name="theme-color" content="#dc2626" />
      </head>
      <body className="bg-gray-50">
        <SupabaseProvider>
          <EnhancedAuthProvider>
            <ClientLayout>
              <main className="min-h-screen">
                {children}
              </main>
            </ClientLayout>
          </EnhancedAuthProvider>
        </SupabaseProvider>
        <Analytics />
      </body>
    </html>
  );
}
