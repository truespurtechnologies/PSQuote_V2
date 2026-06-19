import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export const LoadingSpinner = ({
  message = 'Loading...',
  className = 'min-h-screen flex items-center justify-center bg-black',
  iconClassName = 'h-12 w-12 animate-spin text-red-500 mb-4',
  textClassName = 'text-white',
}: LoadingSpinnerProps) => (
  <div className={className}>
    <div className="flex flex-col items-center">
      <Loader2 className={iconClassName} />
      {message && <p className={textClassName}>{message}</p>}
    </div>
  </div>
);
