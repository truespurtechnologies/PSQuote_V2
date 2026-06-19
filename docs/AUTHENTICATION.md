# Authentication Flow Documentation

This document outlines the authentication flow implemented in the Popular Steels Quotation Generator application. It covers the architecture, components, and usage patterns for handling user authentication.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Components](#components)
- [Authentication Flow](#authentication-flow)
- [Session Management](#session-management)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Security Considerations](#security-considerations)

## Overview
The authentication system is built on top of Supabase Auth, providing secure user authentication with email and password. The system includes:

- User login with email/password
- Session management with automatic refresh
- Protected routes
- Error handling and user feedback
- Comprehensive logging

## Architecture

The authentication system follows a client-server architecture:

1. **Frontend (Next.js)**
   - Handles user interface and form validation
   - Manages authentication state
   - Protects client-side routes
   - Provides user feedback

2. **Backend (Supabase)**
   - Manages user accounts and sessions
   - Handles password hashing and validation
   - Provides JWT tokens for authenticated requests

## Components

### 1. Supabase Client (`lib/supabase-client.ts`)

Core module for interacting with Supabase Auth:

- `supabase`: Configured Supabase client instance
- `getCurrentSession()`: Retrieves the current user session
- `refreshSession()`: Refreshes the current session

### 2. Login Page (`app/page.tsx`)

Handles user authentication:
- Form validation using Zod
- Error handling and user feedback
- Session management
- Redirects after successful login

### 3. Auth Forms (`types/auth-forms.ts`)

TypeScript types and validation schemas for authentication forms:
- `LoginFormData`: Type for login form data
- `AUTH_ERROR_CODES`: Standardized error codes
- `AUTH_ERROR_MESSAGES`: User-friendly error messages
- `mapAuthErrorToCode()`: Maps Supabase errors to application error codes

### 4. Logger (`lib/logger.ts`)

Structured logging utility:
- Multiple log levels (debug, info, warn, error)
- Context-aware logging
- Environment-based log level filtering

## Authentication Flow

### 1. User Login

1. User enters email and password
2. Form validation runs client-side
3. On submit, credentials are sent to Supabase Auth
4. On success:
   - User session is established
   - User is redirected to the landing page
5. On failure:
   - Error message is displayed
   - User can retry login

### 2. Session Management

- **Session Initialization**: On app load, check for existing session
- **Auto-refresh**: Sessions are automatically refreshed before expiration
- **Persistence**: Sessions are persisted across page refreshes
- **Logout**: Properly clears session data and redirects to login

## Session Management

The application implements several session management features:

1. **Session Verification**
   - On app load
   - Before accessing protected routes
   - Periodically in the background

2. **Auto-refresh**
   - Sessions are refreshed before they expire
   - Configurable refresh threshold (default: 5 minutes before expiry)

3. **Error Recovery**
   - Failed refreshes trigger logout
   - Users are redirected to login on session expiration

## Error Handling

### Error Types

1. **Form Validation Errors**
   - Client-side validation using Zod
   - Real-time feedback

2. **Authentication Errors**
   - Invalid credentials
   - Network issues
   - Server errors

3. **Session Errors**
   - Expired sessions
   - Invalid tokens
   - Network issues during refresh

### Error Recovery

- User-friendly error messages
- Automatic retry for transient errors
- Clear recovery paths

## Testing

The authentication system includes comprehensive tests:

### Unit Tests

1. **Login Page**
   - Form validation
   - Error handling
   - Success/failure scenarios

2. **Supabase Client**
   - Session management
   - Error handling
   - Token refresh

### Integration Tests

- Full authentication flow
- Protected route access
- Session persistence

## Security Considerations

1. **Password Security**
   - Passwords are never stored locally
   - Minimum password requirements enforced
   - Secure password reset flow

2. **Session Security**
   - JWT tokens stored in HTTP-only cookies
   - Short-lived access tokens
   - Secure token refresh mechanism

3. **Rate Limiting**
   - Implemented on the server-side
   - Protects against brute force attacks

4. **CSRF Protection**
   - CSRF tokens for sensitive actions
   - Same-site cookie policy

## Development Guide

### Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_LOG_LEVEL=debug
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Adding a Protected Route

1. Create a new page in the `app` directory
2. Use the `useAuth` hook to check authentication
3. Redirect unauthenticated users to the login page

Example:

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function ProtectedPage() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return null; // Will be redirected by the hook

  return <div>Protected Content</div>;
}
```

## Troubleshooting

### Common Issues

1. **Session not persisting**
   - Check cookie settings in Supabase
   - Verify domain configuration

2. **Authentication errors**
   - Check network requests in browser devtools
   - Verify Supabase credentials

3. **Token refresh issues**
   - Verify token expiration settings
   - Check for clock skew between client and server

## Future Improvements

1. **Multi-factor authentication**
2. **Social login providers**
3. **Passwordless authentication**
4. **Advanced session management**
   - Concurrent session control
   - Device management
5. **Enhanced security features**
   - IP-based restrictions
   - Suspicious activity detection
