// Type definitions for environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    // Server-side only
    NODE_ENV: 'development' | 'production' | 'test';
    
    // Public (exposed to the browser)
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    
    // Add other environment variables as needed
    [key: string]: string | undefined;
  }
}

// This makes the types available globally
export {};
