import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../components/ui/button';
import { log } from '../lib/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log detailed error information for debugging
    log.error('Error caught by ErrorBoundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      // In production, sanitize sensitive information
      isProduction: process.env.NODE_ENV === 'production'
    });
  }

  private getSanitizedErrorMessage(error: Error | null): string {
    if (!error) return 'An unexpected error occurred';
    
    // In production, don't expose detailed error messages
    if (process.env.NODE_ENV === 'production') {
      return 'Something went wrong. Please try again.';
    }
    
    // In development, show the actual error message
    return error.message;
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-md">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-gray-300 mb-4">
              {this.getSanitizedErrorMessage(this.state.error)}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
