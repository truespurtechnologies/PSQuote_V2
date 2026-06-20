/**
 * Authentication test utilities
 * Provides helper functions for testing authentication flows
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

// Mock router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock Supabase auth
const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      refreshSession: jest.fn(),
      updateUser: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'USER',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockSession = (overrides = {}) => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + 3600 * 1000,
  expires_in: 3600,
  token_type: 'bearer',
  user: createMockUser(),
  id: 'test-session-id',
  email: 'test@example.com',
  full_name: 'Test User',
  ...overrides,
});

// Authentication test helpers
export class AuthTestHelper {
  static async fillLoginForm(email = 'test@example.com', password = 'password123') {
    const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i) || screen.getByPlaceholderText(/password/i);
    
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, email);
    
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, password);
    
    return { emailInput, passwordInput };
  }

  static async fillSignupForm(userData = {}) {
    const defaults = {
      email: 'test@example.com',
      password: 'Password123!',
      fullName: 'Test User',
      username: 'testuser',
    };
    
    const data = { ...defaults, ...userData };
    
    // Fill form fields if they exist
    const emailInput = screen.queryByLabelText(/email/i) || screen.queryByPlaceholderText(/email/i);
    if (emailInput) {
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, data.email);
    }
    
    const passwordInput = screen.queryByLabelText(/password/i) || screen.queryByPlaceholderText(/password/i);
    if (passwordInput) {
      await userEvent.clear(passwordInput);
      await userEvent.type(passwordInput, data.password);
    }
    
    const fullNameInput = screen.queryByLabelText(/full name/i) || screen.queryByPlaceholderText(/full name/i);
    if (fullNameInput) {
      await userEvent.clear(fullNameInput);
      await userEvent.type(fullNameInput, data.fullName);
    }
    
    const usernameInput = screen.queryByLabelText(/username/i) || screen.queryByPlaceholderText(/username/i);
    if (usernameInput) {
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, data.username);
    }
    
    return data;
  }

  static async submitForm(buttonText = /sign in/i) {
    const submitButton = screen.getByRole('button', { name: buttonText });
    await userEvent.click(submitButton);
    return submitButton;
  }

  static async waitForAuthStateChange() {
    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });
  }

  static async waitForRedirect(expectedPath = '/landing') {
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expectedPath);
    });
  }

  static async waitForErrorMessage() {
    return await screen.findByRole('alert');
  }

  static async waitForSuccessMessage() {
    return await screen.findByText(/success|welcome|signed in/i);
  }

  // Mock authentication responses
  static mockSuccessfulSignIn(session = createMockSession()) {
    mockSignIn.mockResolvedValueOnce({
      data: { user: session.user, session },
      error: null,
    });
    
    mockGetSession.mockResolvedValueOnce({
      data: { session },
      error: null,
    });
    
    return session;
  }

  static mockFailedSignIn(error = { message: 'Invalid credentials' }) {
    mockSignIn.mockResolvedValueOnce({
      data: { user: null, session: null },
      error,
    });
    
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });
    
    return error;
  }

  static mockSuccessfulSignUp(session = createMockSession()) {
    mockSignUp.mockResolvedValueOnce({
      data: { user: session.user, session },
      error: null,
    });
    
    return session;
  }

  static mockFailedSignUp(error = { message: 'User already exists' }) {
    mockSignUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error,
    });
    
    return error;
  }

  static mockSignOut() {
    mockSignOut.mockResolvedValueOnce({
      error: null,
    });
    
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });
  }

  // Test scenarios
  static async testSuccessfulLogin(component: React.ReactElement) {
    const session = this.mockSuccessfulSignIn();
    
    render(component);
    await this.fillLoginForm();
    await this.submitForm();
    
    await this.waitForRedirect('/landing');
    
    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    
    return session;
  }

  static async testFailedLogin(component: React.ReactElement, expectedError = 'Invalid credentials') {
    const error = this.mockFailedSignIn({ message: expectedError });
    
    render(component);
    await this.fillLoginForm();
    await this.submitForm();
    
    const alertElement = await this.waitForErrorMessage();
    expect(alertElement).toHaveTextContent(expectedError);
    
    return error;
  }

  static async testSuccessfulSignup(component: React.ReactElement) {
    const session = this.mockSuccessfulSignUp();
    
    render(component);
    await this.fillSignupForm();
    await this.submitForm(/sign up/i);
    
    await this.waitForRedirect('/landing');
    
    expect(mockSignUp).toHaveBeenCalled();
    
    return session;
  }

  static async testFailedSignup(component: React.ReactElement, expectedError = 'User already exists') {
    const error = this.mockFailedSignup({ message: expectedError });
    
    render(component);
    await this.fillSignupForm();
    await this.submitForm(/sign up/i);
    
    const alertElement = await this.waitForErrorMessage();
    expect(alertElement).toHaveTextContent(expectedError);
    
    return error;
  }

  // Reset all mocks
  static resetMocks() {
    mockPush.mockClear();
    mockSignIn.mockClear();
    mockSignUp.mockClear();
    mockSignOut.mockClear();
    mockGetSession.mockClear();
    mockOnAuthStateChange.mockClear();
  }
}

// Export mocks for direct access in tests
export {
  mockPush,
  mockSignIn,
  mockSignUp,
  mockSignOut,
  mockGetSession,
  mockOnAuthStateChange,
};
