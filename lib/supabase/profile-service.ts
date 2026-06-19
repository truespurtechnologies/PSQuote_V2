import { supabase } from './client';

export type Profile = {
  id: string;
  username: string | null;
  email: string | null;
  full_name: string | null;
  role: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const profileService = {
  // Fetch profile by user ID
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Unexpected error in getProfile:', error);
      return null;
    }
  },

  // Fetch profile by email
  async getProfileByEmail(email: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error fetching profile by email:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Unexpected error in getProfileByEmail:', error);
      return null;
    }
  }
};

export default profileService;
