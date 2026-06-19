import { User } from '@supabase/supabase-js';
import { AppUser, UserMetadata } from '@/types/auth';

export function mapToAppUser(user: User | null): AppUser {
  if (!user) {
    throw new Error('Cannot map null user to AppUser');
  }
  
  if (!user.id) {
    throw new Error('User ID is required');
  }
  
  const now = new Date().toISOString();
  
  // Create a clean user metadata object with the correct types
  const userMetadata: UserMetadata = {
    full_name: user.user_metadata?.full_name || '',
    ...(user.user_metadata?.avatar_url ? { avatar_url: user.user_metadata.avatar_url } : {})
  };

  // Create the AppUser with proper typing and handle potential null values
  const appUser: AppUser = {
    // Required User properties with type safety
    id: user.id,
    aud: user.aud || 'authenticated',
    role: user.role || 'authenticated',
    email: user.email ?? null,
    email_confirmed_at: user.email_confirmed_at ?? null,
    phone: user.phone ?? null,
    confirmation_sent_at: user.confirmation_sent_at ?? null,
    confirmed_at: user.confirmed_at ?? null,
    last_sign_in_at: user.last_sign_in_at ?? now,
    created_at: user.created_at || now,
    updated_at: user.updated_at || now,
    app_metadata: user.app_metadata || {},
    identities: (user.identities || []).map(identity => ({
      id: identity.id || '',
      user_id: identity.user_id || user.id,
      identity_data: identity.identity_data || {},
      provider: identity.provider || '',
      created_at: identity.created_at || now,
      last_sign_in_at: identity.last_sign_in_at || now,
      updated_at: identity.updated_at || now
    } as const)),
    
    // User metadata with proper typing
    user_metadata: {
      full_name: userMetadata.full_name,
      ...(userMetadata.avatar_url ? { avatar_url: userMetadata.avatar_url } : {})
    },
    
    // Additional AppUser properties
    full_name: userMetadata.full_name
  };

  return appUser;
}
