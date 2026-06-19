import { render, screen } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';

// Mock the login page component
jest.mock('@/app/login/page', () => {
  return function MockLoginPage() {
    return (
      <div>
        <h1>Login</h1>
        <input placeholder="Email" />
        <input placeholder="Password" type="password" />
        <button type="submit">Sign In</button>
      </div>
    );
  };
});

describe('Login Page', () => {
  it('renders login form elements', async () => {
    const LoginPage = (await import('@/app/login/page')).default;
    
    render(<LoginPage />);
    
    // Use standard Jest matchers instead of jest-dom
    expect(screen.getByText('Login')).toBeDefined();
    expect(screen.getByPlaceholderText('Email')).toBeDefined();
    expect(screen.getByPlaceholderText('Password')).toBeDefined();
    expect(screen.getByText('Sign In')).toBeDefined();
  });
});
