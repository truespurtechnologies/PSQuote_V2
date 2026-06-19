// Base product type that matches the database schema
export interface ProductBase {
  item_code: string;
  item_name: string;
  item_description: string | null;
  item_category: string | null;
  item_sub_category: string | null;
  item_type: string | null;
  item_size: string | null;
  item_unit: string | null;
  item_weight: number | null;
  item_rate: number | null;
  gst_rate: number | null;
  is_active: boolean;
  [key: string]: string | number | boolean | null; // Index signature for dynamic access
}

// Extended product type with database fields
export interface Product extends ProductBase {
  id: string;
  created_at: string;
  updated_at: string | null;
}

// Type for creating a new product (omits auto-generated fields)
export type NewProduct = Omit<Product, 'id' | 'created_at' | 'updated_at'>;

// Type for editable fields in the product form
export type EditableField = keyof ProductBase;

// Type for the editing state
interface EditingState {
  productId: string;
  field: EditableField | null;
  value: string | number | boolean | null;
}

// Default values for a new product
export const defaultNewProduct: NewProduct = {
  item_code: '',
  item_name: '',
  item_description: null,
  item_category: null,
  item_sub_category: null,
  item_type: null,
  item_size: null,
  item_unit: null,
  item_weight: null,
  item_rate: null,
  gst_rate: null,
  is_active: true,
};

// Type for the product catalog props
export interface ProductCatalogProps {
  // Add any props if needed in the future
}
