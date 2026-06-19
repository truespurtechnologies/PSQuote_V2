import { z } from 'zod';

/**
 * Validation schema for login form
 */
export const loginSchema = z.object({
  email: z.string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .max(100, { message: "Email is too long" })
    .transform(email => email.trim().toLowerCase()), // Normalize email
  password: z.string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100, { message: "Password is too long" })
});

/**
 * Type for login form data
 */
export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Authentication error codes and their user-friendly messages
 */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'auth/invalid-credentials',
  EMAIL_NOT_VERIFIED: 'auth/email-not-verified',
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  NETWORK_ERROR: 'auth/network-request-failed',
  SESSION_ERROR: 'auth/session-error',
  UNKNOWN_ERROR: 'auth/unknown-error',
} as const;

export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];

/**
 * User-friendly error messages for authentication errors
 */
export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: 'The email or password you entered is incorrect.',
  [AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED]: 'Please verify your email before logging in.',
  [AUTH_ERROR_CODES.TOO_MANY_REQUESTS]: 'Too many login attempts. Please try again later.',
  [AUTH_ERROR_CODES.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection.',
  [AUTH_ERROR_CODES.SESSION_ERROR]: 'Failed to establish a valid session. Please try again.',
  [AUTH_ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
} as const;

/**
 * Maps server error messages to our application error codes
 */
export const mapAuthErrorToCode = (error: unknown): AuthErrorCode => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (!errorMessage) return AUTH_ERROR_CODES.UNKNOWN_ERROR;
  
  const lowerCaseMessage = errorMessage.toLowerCase();
  
  if (lowerCaseMessage.includes('invalid login credentials') || 
      lowerCaseMessage.includes('invalid email or password')) {
    return AUTH_ERROR_CODES.INVALID_CREDENTIALS;
  }
  
  if (lowerCaseMessage.includes('email not confirmed') || 
      lowerCaseMessage.includes('email not verified')) {
    return AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED;
  }
  
  if (lowerCaseMessage.includes('rate limit') || 
      lowerCaseMessage.includes('too many requests')) {
    return AUTH_ERROR_CODES.TOO_MANY_REQUESTS;
  }
  
  if (lowerCaseMessage.includes('network request failed') || 
      lowerCaseMessage.includes('failed to fetch')) {
    return AUTH_ERROR_CODES.NETWORK_ERROR;
  }
  
  return AUTH_ERROR_CODES.UNKNOWN_ERROR;
};

/**
 * Authentication response type
 */
export interface AuthResponse {
  success: boolean;
  error?: {
    code: AuthErrorCode;
    message: string;
    details?: unknown;
  };
  data?: {
    userId: string;
    email: string;
    fullName?: string;
    isVerified: boolean;
  };
}

/**
 * Login response type
 */
export interface LoginResponse extends AuthResponse {
  requiresTwoFactor?: boolean;
  recoveryCodes?: string[];
}

/**
 * Password requirements for validation
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
} as const;

/**
 * Validates if a password meets all requirements
 */
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return { 
      valid: false, 
      message: `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long` 
    };
  }
  
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    return { 
      valid: false, 
      message: 'Password must contain at least one uppercase letter' 
    };
  }
  
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    return { 
      valid: false, 
      message: 'Password must contain at least one lowercase letter' 
    };
  }
  
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    return { 
      valid: false, 
      message: 'Password must contain at least one number' 
    };
  }
  
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    return { 
      valid: false, 
      message: 'Password must contain at least one special character' 
    };
  }
  
  return { valid: true };
};
