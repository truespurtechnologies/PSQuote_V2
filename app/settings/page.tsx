import { Suspense } from 'react';
import { Skeleton } from "../../components/ui/skeleton"
import { SettingsContent } from './SettingsContent';

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white p-8">
        <div className="container mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="flex space-x-4 mb-8">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
