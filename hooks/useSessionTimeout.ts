import React, { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '../components/ui/use-toast';
import { supabase } from '../lib/supabase/client';

/**
 * Simple debounce function to limit how often a function can be called
 * @param func The function to debounce
 * @param wait Time to wait in milliseconds
 * @returns Debounced function
 */
function debounce<F extends (...args: any[]) => any>(func: F, wait: number): (...args: Parameters<F>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function(this: any, ...args: Parameters<F>) {
    const context = this;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      func.apply(context, args);
    }, wait);
  };
}

// Get timeout values from environment variables with fallback defaults
// If the feature flag to enable timeouts is NOT set, we effectively disable timeouts
const isSessionTimeoutEnabled = () => {
  // Default: disabled (keep user logged in until manual logout)
  return String(process.env.NEXT_PUBLIC_ENABLE_SESSION_TIMEOUT).toLowerCase() === 'true';
};

const getSessionTimeoutMs = () => {
  if (!isSessionTimeoutEnabled()) return Number.POSITIVE_INFINITY;
  if (typeof process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MS === 'string') {
    const value = parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MS, 10);
    if (!isNaN(value) && value > 0) return value * 60 * 1000; // Convert minutes to milliseconds
  }
  return 30 * 60 * 1000; // Default: 30 minutes
};

const getWarningTimeMs = () => {
  if (!isSessionTimeoutEnabled()) return Number.POSITIVE_INFINITY;
  if (typeof process.env.NEXT_PUBLIC_SESSION_WARNING_TIME_MS === 'string') {
    const value = parseInt(process.env.NEXT_PUBLIC_SESSION_WARNING_TIME_MS, 10);
    if (!isNaN(value) && value > 0) return value * 60 * 1000; // Convert minutes to milliseconds
  }
  return 5 * 60 * 1000; // Default: 5 minutes
};

// We'll calculate these values when the hook is called
// to ensure we pick up any runtime environment variable changes

/**
 * Props for the useSessionTimeout hook
 */
interface UseSessionTimeoutProps {
  /**
   * Callback function called when the session times out
   * Can be async to handle cleanup operations
   */
  onTimeout?: () => void | Promise<void>;
  
  /**
   * Callback function called when the session is about to time out
   * @param remainingTime - Remaining time in minutes before session timeout
   */
  onWarning?: (remainingTime: number) => void;
}

/**
 * Custom hook to manage session timeout functionality
 * 
 * @example
 * // Basic usage
 * useSessionTimeout({
 *   onTimeout: () => console.log('Session expired'),
 *   onWarning: (remaining) => console.log(`Session expiring in ${remaining} minutes`)
 * });
 * 
 * @param {Object} props - Configuration options
 * @param {Function} [props.onTimeout] - Callback when session times out
 * @param {Function} [props.onWarning] - Callback when session is about to time out
 * @returns {Object} Object containing resetSessionTimer function
 */
export function useSessionTimeout({ onTimeout, onWarning }: UseSessionTimeoutProps = {}) {
  const router = useRouter();
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  const onWarningRef = useRef(onWarning);
  const resetSessionTimerRef = useRef<() => void>(() => {});
  
  // Get timeout values at runtime
  const [sessionTimeoutMs, setSessionTimeoutMs] = React.useState(getSessionTimeoutMs());
  const [warningTimeMs, setWarningTimeMs] = React.useState(getWarningTimeMs());
  const [timeoutsEnabled, setTimeoutsEnabled] = React.useState(isSessionTimeoutEnabled());
  
  // Update timeouts if environment variables change
  React.useEffect(() => {
    setSessionTimeoutMs(getSessionTimeoutMs());
    setWarningTimeMs(getWarningTimeMs());
    setTimeoutsEnabled(isSessionTimeoutEnabled());
  }, [
    process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MS, 
    process.env.NEXT_PUBLIC_SESSION_WARNING_TIME_MS,
    process.env.NEXT_PUBLIC_ENABLE_SESSION_TIMEOUT
  ]);

  // Keep refs in sync with the latest callbacks
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
    onWarningRef.current = onWarning;
  }, [onTimeout, onWarning]);

  // Show warning toast with extend button
  const showWarningToast = useCallback((remainingMinutes: number) => {
    if (!timeoutsEnabled) return;
    // Create a button element for the toast action
    const button = document.createElement('button');
    button.textContent = 'Extend Session';
    button.className = 'ml-2 px-3 py-1 bg-white text-destructive rounded-md hover:bg-gray-100';
    button.onclick = (e: MouseEvent) => {
      e.preventDefault();
      resetSessionTimerRef.current();
    };

    // Show warning toast
    toast({
      title: 'Session Expiring Soon',
      description: `Your session will expire in ${remainingMinutes} minutes.`,
      variant: 'destructive',
      duration: 10000,
    });

    // Add the button to the toast
    setTimeout(() => {
      const toastElement = document.querySelector('[role="alert"]');
      if (toastElement) {
        toastElement.appendChild(button);
      }
    }, 100);
  }, []);

  /**
   * Resets the session timer and sets up new timeouts
   * This function is called on user activity and when the component mounts
   */
  const resetSessionTimer = useCallback(() => {
    // If timeouts are disabled, do nothing to keep session alive indefinitely
    if (!timeoutsEnabled) {
      // Ensure any pre-existing timers are cleared
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
      return;
    }
    // Clear existing timeouts
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }

    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }

    // Set warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      const remaining = sessionTimeoutMs - warningTimeMs;
      const remainingMinutes = Math.ceil(remaining / 60000);

      // Call warning callback if provided
      if (onWarningRef.current) {
        onWarningRef.current(remainingMinutes);
      }

      // Show warning toast
      showWarningToast(remainingMinutes);
    }, sessionTimeoutMs - warningTimeMs);

    // Set session timeout (disabled becomes a no-op due to early return)
    sessionTimeoutRef.current = setTimeout(async () => {
      try {
        // Call timeout callback if provided, but DO NOT sign the user out automatically
        if (onTimeoutRef.current) {
          await onTimeoutRef.current();
        }
      } catch (error) {
        console.error('Error during session timeout callback:', error);
      }
    }, sessionTimeoutMs);
  }, [router, showWarningToast, sessionTimeoutMs, warningTimeMs, timeoutsEnabled]);

  // Store the latest resetSessionTimer in a ref to avoid dependency issues
  // This allows the timer to be reset from event handlers without causing
  // unnecessary effect re-runs
  useEffect(() => {
    resetSessionTimerRef.current = resetSessionTimer;
    
    // Initial setup
    resetSessionTimer();
    
    // Cleanup on unmount
    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, [resetSessionTimer]);

  // Set up debounced event listeners to detect user activity
  // These events will reset the session timer when triggered, with debouncing
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;
    
    // Debounce the reset function to prevent excessive calls
    // Using a 1-second debounce to balance responsiveness and performance
    const debouncedReset = debounce(resetSessionTimer, 1000);
    
    const handleUserActivity = () => {
      debouncedReset();
    };
    
    // Add event listeners with passive: true for better scroll performance
    const options = { passive: true, capture: true };
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity, options);
    });
    
    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity, options);
      });
    };
  }, [resetSessionTimer]);

  return { resetSessionTimer };
}
