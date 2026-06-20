// This is a manually created type definition file for Supabase
// In a production environment, these types should be generated using the Supabase CLI

// Main database type
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          email: string | null
          full_name: string | null
          role: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          email?: string | null
          full_name?: string | null
          role?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          email?: string | null
          full_name?: string | null
          role?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      products: {
        Row: {
          id: string
          item_code: string | null
          item_name: string
          item_description: string | null
          item_weight: number | null
          unit_price: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          item_code?: string | null
          item_name: string
          item_description?: string | null
          item_weight?: number | null
          unit_price?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          item_code?: string | null
          item_name?: string
          item_description?: string | null
          item_weight?: number | null
          unit_price?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string
          email: string | null
          address: string | null
          gstin: string | null
          state_code: string | null
          state_name: string | null
          is_active: boolean | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string | null
          address?: string | null
          gstin?: string | null
          state_code?: string | null
          state_name?: string | null
          is_active?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string | null
          address?: string | null
          gstin?: string | null
          state_code?: string | null
          state_name?: string | null
          is_active?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string
        }
      }
      quotations: {
        Row: {
          id: string
          quotation_number: string
          customer_name: string
          customer_phone: string | null
          customer_id: string | null
          company_name: string
          account_no: string | null
          bank_name: string | null
          ifsc_code: string | null
          date: string
          subtotal: number
          loading_charges: number
          gst_rate: number
          gst_amount: number
          round_off: number
          grand_total: number
          status: string
          terms_conditions: string[]
          created_at: string | null
          updated_at: string | null
          created_by: string
        }
        Insert: {
          id?: string
          quotation_number: string
          customer_name: string
          customer_phone?: string | null
          customer_id?: string | null
          company_name: string
          account_no?: string | null
          bank_name?: string | null
          ifsc_code?: string | null
          date: string
          subtotal: number
          loading_charges: number
          gst_rate: number
          gst_amount: number
          round_off: number
          grand_total: number
          status?: string
          terms_conditions: string[]
          created_at?: string | null
          updated_at?: string | null
          created_by: string
        }
        Update: {
          id?: string
          quotation_number?: string
          customer_name?: string
          customer_phone?: string | null
          customer_id?: string | null
          company_name?: string
          account_no?: string | null
          bank_name?: string | null
          ifsc_code?: string | null
          date?: string
          subtotal?: number
          loading_charges?: number
          gst_rate?: number
          gst_amount?: number
          round_off?: number
          grand_total?: number
          status?: string
          terms_conditions?: string[]
          created_at?: string | null
          updated_at?: string | null
          created_by?: string
        }
      }
      quotation_items: {
        Row: {
          id: string
          quotation_id: string
          product_id: string | null
          description: string
          qty: number
          qty_in_kg_pc: number
          total_qty_kg: number | null
          unit_rate: number
          total_value: number
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          quotation_id: string
          product_id?: string | null
          description: string
          qty: number
          qty_in_kg_pc: number
          total_qty_kg?: number | null
          unit_rate: number
          total_value?: number
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          quotation_id?: string
          product_id?: string | null
          description?: string
          qty?: number
          qty_in_kg_pc?: number
          total_qty_kg?: number | null
          unit_rate?: number
          total_value?: number
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'user'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Re-export for convenience
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
