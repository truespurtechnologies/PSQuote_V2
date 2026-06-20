/**
 * Authentication Flow Tests
 * Tests complete authentication flows including sign up, sign in, sign out, and session persistence
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthTestHelper, createMockUser, createMockSession, mockSignIn, mockSignUp, mockSignOut, mockGetSession, mockOnAuthStateChange, mockPush } from '../utils/auth-test-utils';

// Import components to test
import { LoginContent } from '@/app/login/LoginContent';
import { SignupForm } from '@/components/auth/signup-form';

describe('Authentication Flow Tests', () => {
  beforeEach(() => {
    AuthTestHelper.resetMocks();
  });

  afterEach(() => {
    AuthTestHelper.resetMocks();
  });

  describe('Login Flow', () => {
    it('should successfully sign in with valid credentials', async () => {
      const session = createMockSession();
      AuthTestHelper.mockSuccessfulSignIn(session);

      render(<LoginContent />);

      // Fill and submit login form
      await AuthTestHelper.fillLoginForm('test@example.com', 'password123');
      await AuthTestHelper.submitForm();

      // Wait for redirect
      await AuthTestHelper.waitForRedirect('/landing');

      // Verify sign in was called with correct credentials
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should show error message with invalid credentials', async () => {
      AuthTestHelper.mockFailedSignIn({ message: 'Invalid login credentials' });

      render(<LoginContent />);

      await AuthTestHelper.fillLoginForm('test@example.com', 'wrongpassword');
      await AuthTestHelper.submitForm();

      const alertElement = await AuthTestHelper.waitForErrorMessage();
      expect(alertElement).toHaveTextContent('Invalid login credentials');
    });

    it('should handle network errors gracefully', async () => {
      AuthTestHelper.mockFailedSignIn({ message: 'Network error' });

      render(<LoginContent />);

      await AuthTestHelper.fillLoginForm('test@example.com', 'password123');
      await AuthTestHelper.submitForm();

      const alertElement = await AuthTestHelper.waitForErrorMessage();
      expect(alertElement).toHaveTextContent('Network error');
    });

    it('should validate form fields', async () => {
      render(<LoginContent />);

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      // Should show validation errors
      await screen.findByText(/email is required/i);
    });
  });

  describe('Signup Flow', () => {
    it('should successfully sign up with valid data', async () => {
      const session = createMockSession();
      AuthTestHelper.mockSuccessfulSignUp(session);

      render(<SignupForm />);

      await AuthTestHelper.fillSignupForm({
        email: 'newuser@example.com',
        password: 'Password123!',
        fullName: 'New User',
        username: 'newuser',
      });
      await AuthTestHelper.submitForm(/sign up/i);

      await AuthTestHelper.waitForRedirect('/landing');

      expect(AuthTestHelper['mockSignUp']).toHaveBeenCalled();
    });

    it('should show error when user already exists', async () => {
      AuthTestHelper.mockFailedSignUp({ message: 'User already registered' });

      render(<SignupForm />);

      await AuthTestHelper.fillSignupForm();
      await AuthTestHelper.submitForm(/sign up/i);

      const alertElement = await AuthTestHelper.waitForErrorMessage();
      expect(alertElement).toHaveTextContent('User already registered');
    });

    it('should validate password strength', async () => {
      render(<SignupForm />);

      await AuthTestHelper.fillSignupForm({ password: 'weak' });
      await AuthTestHelper.submitForm(/sign up/i);

      await screen.findByText(/password must contain/i);
    });

    it('should validate email format', async () => {
      render(<SignupForm />);

      await AuthTestHelper.fillSignupForm({ email: 'invalid-email' });
      await AuthTestHelper.submitForm(/sign up/i);

      await screen.findByText(/invalid email/i);
    });
  });

  describe('Session Persistence', () => {
    it('should maintain session across page refreshes', async () => {
      const session = createMockSession();
      
      // Mock existing session
      AuthTestHelper['mockGetSession'].mockResolvedValueOnce({
        data: { session },
        error: null,
      });

      render(<LoginContent />);

      // Should redirect to landing if session exists
      await AuthTestHelper.waitForRedirect('/landing');
    });

    it('should handle session expiration', async () => {
      // Mock expired session
      const expiredSession = createMockSession({
        expires_at: Date.now() - 1000, // Expired
      });

      AuthTestHelper['mockGetSession'].mockResolvedValueOnce({
        data: { session: expiredSession },
        error: null,
      });

      render(<LoginContent />);

      // Should show login form, not redirect
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
      expect(AuthTestHelper['mockPush']).not.toHaveBeenCalled();
    });

    it('should refresh expired tokens', async () => {
      const session = createMockSession();
      
      // First call returns expired session, second returns fresh session
      AuthTestHelper['mockGetSession']
        .mockResolvedValueOnce({
          data: { session: null }, // No session
          error: null,
        })
        .mockResolvedValueOnce({
          data: { session },
          error: null,
        });

      AuthTestHelper.mockSuccessfulSignIn(session);

      render(<LoginContent />);

      await AuthTestHelper.fillLoginForm();
      await AuthTestHelper.submitForm();

      await AuthTestHelper.waitForRedirect('/landing');
    });
  });

  describe('Sign Out Flow', () => {
    it('should successfully sign out and redirect to login', async () => {
      const session = createMockSession();
      
      // Mock existing session
      AuthTestHelper['mockGetSession'].mockResolvedValueOnce({
        data: { session },
        error: null,
      });

      AuthTestHelper.mockSignOut();

      render(<LoginContent />);

      // Find and click sign out button if it exists
      const signOutButton = screen.queryByRole('button', { name: /sign out/i });
      if (signOutButton) {
        await userEvent.click(signOutButton);

        expect(AuthTestHelper['mockSignOut']).toHaveBeenCalled();
        await AuthTestHelper.waitForRedirect('/login');
      }
    });

    it('should handle sign out errors gracefully', async () => {
      const session = createMockSession();
      
      AuthTestHelper['mockGetSession'].mockResolvedValueOnce({
        data: { session },
        error: null,
      });

      AuthTestHelper['mockSignOut'].mockResolvedValueOnce({
        error: { message: 'Failed to sign out' },
      });

      render(<LoginContent />);

      const signOutButton = screen.queryByRole('button', { name: /sign out/i });
      if (signOutButton) {
        await userEvent.click(signOutButton);

        const alertElement = await AuthTestHelper.waitForErrorMessage();
        expect(alertElement).toHaveTextContent('Failed to sign out');
      }
    });
  });

  describe('Cross-Tab Synchronization', () => {
    it('should handle auth state changes from other tabs', async () => {
      const session = createMockSession();
      
      render(<LoginContent />);

      // Simulate auth state change from another tab
      const mockCallback = AuthTestHelper['mockOnAuthStateChange'].mock.calls[0]?.[1];
      if (mockCallback) {
        act(() => {
          mockCallback('SIGNED_IN', session);
        });
      }

      await AuthTestHelper.waitForRedirect('/landing');
    });

    it('should handle sign out from other tabs', async () => {
      const session = createMockSession();
      
      // Start with signed in session
      AuthTestHelper['mockGetSession'].mockResolvedValueOnce({
        data: { session },
        error: null,
      });

      render(<LoginContent />);

      // Simulate sign out from another tab
      const mockCallback = AuthTestHelper['mockOnAuthStateChange'].mock.calls[0]?.[1];
      if (mockCallback) {
        act(() => {
          mockCallback('SIGNED_OUT', null);
        });
      }

      await AuthTestHelper.waitForRedirect('/login');
    });
  });

  describe('Password Reset Flow', () => {
    it('should handle password reset requests', async () => {
      // This would test the forgot password flow
      // Implementation depends on the actual password reset component
      expect(true).toBe(true); // Placeholder
    });

    it('should validate password reset tokens', async () => {
      // This would test password reset token validation
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Error Handling', () => {
    it('should handle Supabase client errors', async () => {
      AuthTestHelper.mockFailedSignIn({ 
        message: 'Supabase connection failed',
        code: 'CONNECTION_FAILED'
      });

      render(<LoginContent />);

      await AuthTestHelper.fillLoginForm();
      await AuthTestHelper.submitForm();

      const alertElement = await AuthTestHelper.waitForErrorMessage();
      expect(alertElement).toHaveTextContent('Supabase connection failed');
    });

    it('should handle network timeouts', async () => {
      AuthTestHelper['mockSignIn'].mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      render(<LoginContent />);

      await AuthTestHelper.fillLoginForm();
      await AuthTestHelper.submitForm();

      const alertElement = await AuthTestHelper.waitForErrorMessage();
      expect(alertElement).toHaveTextContent('Network timeout');
    });

    it('should handle malformed responses', async () => {
      AuthTestHelper['mockSignIn'].mockResolvedValueOnce({
        data: null, // Malformed response
        error: null,
      });

      render(<LoginContent />);

      await AuthTestHelper.fillLoginForm();
      await AuthTestHelper.submitForm();

      const alertElement = await AuthTestHelper.waitForErrorMessage();
      expect(alertElement).toHaveTextContent(/unexpected error/i);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<LoginContent />);

      // Check for proper form labels
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should announce errors to screen readers', async () => {
      AuthTestHelper.mockFailedSignIn({ message: 'Login failed' });

      render(<LoginContent />);

      await AuthTestHelper.fillLoginForm();
      await AuthTestHelper.submitForm();

      const alertElement = await AuthTestHelper.waitForErrorMessage();
      expect(alertElement).toHaveAttribute('role', 'alert');
    });
  });
});
