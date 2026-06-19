import { Session, User } from '@supabase/supabase-js';

export interface UserMetadata {
  full_name?: string;
  avatar_url?: string;
  [key: string]: any;
}

// Extend the base User type and make properties match Supabase's nullable fields
type RequiredUser = Omit<User, 'user_metadata' | 'app_metadata' | 'identities' | 'email' | 'phone' | 'email_confirmed_at' | 'confirmation_sent_at' | 'confirmed_at' | 'last_sign_in_at' | 'created_at' | 'updated_at'> & {
  // Required fields with proper null handling
  id: string;
  aud: string;
  role?: string;
  email: string | null;
  email_confirmed_at: string | null;
  phone: string | null;
  confirmation_sent_at: string | null;
  confirmed_at: string | null;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
  app_metadata: Record<string, any>;
  identities: Array<{
    id: string;
    user_id: string;
    identity_data: Record<string, any>;
    provider: string;
    created_at: string;
    last_sign_in_at: string;
    updated_at: string;
  }>;
};

export interface AppUser extends RequiredUser {
  user_metadata: UserMetadata;
  full_name?: string;
}

// Extend the base Session type to include user properties directly on the session
export interface AppSession extends Omit<Session, 'user'> {
  // Keep the user property for backward compatibility
  user: AppUser;
  
  // Direct session properties
  id: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number; // Make this optional to match Supabase's Session type
  token_type: string;
  
  // User properties
  username?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string | null;
  
  // Standard Supabase session properties
  provider_token?: string | null;
  provider_refresh_token?: string | null;
}

export interface AuthState {
  session: AppSession | null;
  isLoading: boolean;
  error: string | null;
}

export type AuthAction =
  | { type: 'SET_SESSION'; payload: AppSession | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

export const initialAuthState: AuthState = {
  session: null,
  isLoading: true,
  error: null,
};

export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};
