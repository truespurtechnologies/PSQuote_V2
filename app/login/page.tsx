'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { LoginContent } from './LoginContent';

export default function LoginPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
