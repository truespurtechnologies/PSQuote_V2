import { Database as DatabaseGenerated } from '../lib/database.types';

export type Database = DatabaseGenerated;

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

export type Product = Tables<'products'>;
export type NewProduct = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
