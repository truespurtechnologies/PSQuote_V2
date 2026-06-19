/**
 * Safely get environment variables with proper typing and error handling
 * Works in both server and client components
 */

type EnvKey = 
  | 'NEXT_PUBLIC_SUPABASE_URL'
  | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  | 'NEXT_PUBLIC_API_URL'
  | 'NEXT_PUBLIC_DEBUG'
  | 'NEXT_PUBLIC_SESSION_REFRESH_INTERVAL'
  | 'NEXT_PUBLIC_FEATURE_AUTH'
  | 'NEXT_PUBLIC_FEATURE_ANALYTICS'
  | 'NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS'
  | 'NEXT_PUBLIC_LOCKOUT_DURATION'
  | 'NEXT_PUBLIC_ALLOWED_ORIGINS'
  | 'NEXT_PUBLIC_MAX_UPLOAD_SIZE'
  | 'NEXT_PUBLIC_ALLOWED_FILE_TYPES';

/**
 * Get an environment variable value
 * @param key Environment variable name (must be prefixed with NEXT_PUBLIC_ for client-side access)
 * @param defaultValue Optional default value if the variable is not set
 * @returns The environment variable value or the default value if provided
 */
export function getEnv(key: EnvKey, defaultValue?: string): string {
  // In Next.js, environment variables are available in process.env
  // For client-side, they must be prefixed with NEXT_PUBLIC_
  const value = process.env[key] || '';
  
  if (value) return value;
  if (defaultValue !== undefined) return defaultValue;
  
  // In development, log a warning but don't throw
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Environment variable ${key} is not set`);
  }
  
  return '';
}

/**
 * Get a required environment variable (throws if not set)
 */
export function getRequiredEnv(key: EnvKey): string {
  const value = getEnv(key);
  if (!value) {
    const error = new Error(`Required environment variable ${key} is not set`);
    console.error(error);
    throw error;
  }
  return value;
}

/**
 * Get a boolean environment variable
 */
export function getBooleanEnv(key: EnvKey, defaultValue = false): boolean {
  const value = getEnv(key);
  if (value === '') return defaultValue;
  return value === 'true' || value === '1';
}

/**
 * Get a number environment variable
 */
export function getNumberEnv(key: EnvKey, defaultValue = 0): number {
  const value = getEnv(key);
  if (value === '') return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

// Pre-defined getters for common environment variables
export const env = {
  // Supabase
  supabaseUrl: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  
  // API
  apiUrl: getEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3000/api'),
  
  // Features
  isAuthEnabled: getBooleanEnv('NEXT_PUBLIC_FEATURE_AUTH', true),
  isAnalyticsEnabled: getBooleanEnv('NEXT_PUBLIC_FEATURE_ANALYTICS', false),
  
  // Session
  sessionRefreshInterval: getNumberEnv('NEXT_PUBLIC_SESSION_REFRESH_INTERVAL', 300000),
  
  // Security
  maxLoginAttempts: getNumberEnv('NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS', 5),
  lockoutDuration: getNumberEnv('NEXT_PUBLIC_LOCKOUT_DURATION', 15),
  
  // CORS
  allowedOrigins: getEnv('NEXT_PUBLIC_ALLOWED_ORIGINS', 'http://localhost:3000').split(',').map(s => s.trim()),
  
  // File uploads
  maxUploadSize: getNumberEnv('NEXT_PUBLIC_MAX_UPLOAD_SIZE', 5 * 1024 * 1024), // 5MB default
  allowedFileTypes: getEnv('NEXT_PUBLIC_ALLOWED_FILE_TYPES', 'image/jpeg,image/png,application/pdf').split(',').map(s => s.trim()),
  
  // Debug
  isDebug: getBooleanEnv('NEXT_PUBLIC_DEBUG', process.env.NODE_ENV === 'development')
} as const;
