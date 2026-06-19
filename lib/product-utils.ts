import { Product, NewProduct } from "@/types/product";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

export const fetchProducts = async ({
  supabase,
  searchTerm = "",
  currentPage = 1,
  itemsPerPage = 10,
}: {
  supabase: ReturnType<typeof createClientComponentClient<Database>>;
  searchTerm?: string;
  currentPage?: number;
  itemsPerPage?: number;
}) => {
  try {
    // Build the base query
    let query = supabase.from("products").select("*", { count: "exact" });

    // Apply search filter if search term exists
    if (searchTerm.trim()) {
      query = query.or(
        `item_code.ilike.%${searchTerm}%,` +
          `item_name.ilike.%${searchTerm}%,` +
          `item_description.ilike.%${searchTerm}%`
      );
    }

    // Apply pagination
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: (data as Product[]) || [],
      count: count || 0,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      data: [],
      count: 0,
      error: error as Error,
    };
  }
};

export const createProduct = async (
  supabase: ReturnType<typeof createClientComponentClient<Database>>,
  product: NewProduct
) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return { data: data as Product, error: null };
  } catch (error) {
    console.error("Error creating product:", error);
    return { data: null, error: error as Error };
  }
};

export const updateProduct = async (
  supabase: ReturnType<typeof createClientComponentClient<Database>>,
  id: string,
  updates: Partial<Product>
) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as Product, error: null };
  } catch (error) {
    console.error("Error updating product:", error);
    return { data: null, error: error as Error };
  }
};

export const deleteProduct = async (
  supabase: ReturnType<typeof createClientComponentClient<Database>>,
  id: string
) => {
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { error: error as Error };
  }
};

export const toggleProductStatus = async (
  supabase: ReturnType<typeof createClientComponentClient<Database>>,
  id: string,
  currentStatus: boolean
) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .update({ is_active: !currentStatus })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as Product, error: null };
  } catch (error) {
    console.error("Error toggling product status:", error);
    return { data: null, error: error as Error };
  }
};
