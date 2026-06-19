export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      // Define your tables here
      profiles: {
        Row: {
          id: string;
          updated_at?: string;
          username: string;
          full_name?: string;
          avatar_url?: string;
          website?: string;
        };
        Insert: {
          id: string;
          updated_at?: string;
          username: string;
          full_name?: string;
          avatar_url?: string;
          website?: string;
        };
        Update: {
          id?: string;
          updated_at?: string;
          username?: string;
          full_name?: string;
          avatar_url?: string;
          website?: string;
        };
      };
      // Add more tables as needed
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}