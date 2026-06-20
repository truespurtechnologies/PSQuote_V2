'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth as useEnhancedAuth } from '@/components/auth/enhanced-auth-context';
import { AppSession } from '@/types/auth';
import { supabase } from '@/lib/supabase/client';

/**
 * A hook that provides authentication state and methods.
 * This is a wrapper around the enhanced auth context for backward compatibility.
 */
export const useAuth = (requireAuth = true) => {
  const router = useRouter();
  const { 
    state: { user, session, loading: isLoading, error },
    signIn,
    signUp,
    signOut,
    refreshSession
  } = useEnhancedAuth();

  // Password reset function
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // Update password function - handles both authenticated and unauthenticated password updates
  const updatePassword = async (newPassword: string) => {
    try {
      // First try with the regular updateUser (for authenticated users)
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      // If we get an auth session error, try with the resetPasswordForEmail flow
      if (updateError?.message?.includes('Auth session missing')) {
        const { error: resetError } = await supabase.auth.updateUser({
          password: newPassword,
        }, {
          emailRedirectTo: `${window.location.origin}/login?reset=success`
        });
        
        if (resetError) throw resetError;
        return { error: null };
      }

      if (updateError) throw updateError;
      return { error: null };
    } catch (err) {
      console.error('Error updating password:', err);
      return { error: err instanceof Error ? err : new Error('Failed to update password') };
    }
  };

  // Send password reset email function
  const sendPasswordResetEmail = async (email: string) => {
    try {
      // Directly point to the update-password page
      const redirectUrl = `${window.location.origin}/update-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      
      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.error('Error sending password reset email:', err);
      return { 
        error: err instanceof Error ? err : new Error('Failed to send password reset email') 
      };
    }
  };

  // Use the session directly with proper type assertion
  const appSession: AppSession | null = session as AppSession | null;

  // REMOVED: Client-side auth redirect logic
  // The middleware.ts already handles authentication redirects on the server side
  // Removing this prevents unnecessary redirects when switching tabs that cause form data loss
  // 
  // Previous issue: When switching tabs, this useEffect would trigger and redirect to /login
  // even though the user was authenticated, causing loss of form data in pages like /new-quotation
  //
  // The middleware is the single source of truth for auth redirects

  return {
    session: appSession,
    user,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    sendPasswordResetEmail,
    refreshSession,
    checkAndRefreshSession: refreshSession, // Alias for backward compatibility
  };
};

// Re-export the enhanced auth context for direct access when needed
export { useEnhancedAuth };
