/**
 * Basic Authentication Tests
 * Simple tests to verify authentication components work correctly
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('Basic Authentication Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Page', () => {
    it('renders login form elements', async () => {
      const { LoginContent } = await import('@/app/login/LoginContent');
      
      render(<LoginContent />);
      
      // Check if key elements are present
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('validates email input', async () => {
      const { LoginContent } = await import('@/app/login/LoginContent');
      
      render(<LoginContent />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      // Try to submit with invalid email
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.click(submitButton);
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });

    it('validates required fields', async () => {
      const { LoginContent } = await import('@/app/login/LoginContent');
      
      render(<LoginContent />);
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      // Try to submit empty form
      await userEvent.click(submitButton);
      
      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Signup Form', () => {
    it('renders signup form elements', async () => {
      const { SignupForm } = await import('@/components/auth/signup-form');
      
      render(<SignupForm />);
      
      // Check if key elements are present
      expect(screen.getByText(/sign up/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('validates password strength', async () => {
      const { SignupForm } = await import('@/components/auth/signup-form');
      
      render(<SignupForm />);
      
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      
      // Try to submit with weak password
      await userEvent.clear(passwordInput);
      await userEvent.type(passwordInput, '123');
      await userEvent.click(submitButton);
      
      // Should show password validation error
      await waitFor(() => {
        expect(screen.getByText(/password must be at least/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authentication Flow Integration', () => {
    it('handles successful login', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockSignIn = (supabase.auth.signInWithPassword as jest.Mock);
      
      // Mock successful sign in
      mockSignIn.mockResolvedValueOnce({
        data: {
          user: { id: 'test-id', email: 'test@example.com' },
          session: { access_token: 'test-token' }
        },
        error: null,
      });

      const LoginContent = (await import('@/app/login/LoginContent')).default;
      render(<LoginContent />);
      
      // Fill form and submit
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Verify sign in was called
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('handles login error', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockSignIn = (supabase.auth.signInWithPassword as jest.Mock);
      
      // Mock failed sign in
      mockSignIn.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      const LoginContent = (await import('@/app/login/LoginContent')).default;
      render(<LoginContent />);
      
      // Fill form and submit
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });
});
