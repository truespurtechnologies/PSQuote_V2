import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';
import { Skeleton } from '../../components/ui/skeleton';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
