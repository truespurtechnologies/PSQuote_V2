// External Dependencies
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Pencil, Save, X, Trash2, Check, Loader2 } from 'lucide-react';
import debounce from 'lodash.debounce';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Define Database type based on your Supabase schema
type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          item_code: string;
          item_name: string;
          item_description: string;
          item_category: string;
          item_sub_category: string;
          item_type: string;
          item_size: string;
          item_unit: string;
          item_weight: number;
          item_rate: number;
          gst_rate: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>> & { updated_at?: string };
      };
    };
  };
};

// Define types for the component
interface ProductBase {
  id: string;
  item_code: string;
  item_name: string;
  item_description: string;
  item_category: string;
  item_sub_category: string;
  item_type: string;
  item_size: string;
  item_unit: string;
  item_weight: number;
  item_rate: number;
  gst_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Define editable fields
type EditableField = 'item_name' | 'item_description' | 'item_rate' | 'item_unit' | 'is_active' | 
  'item_category' | 'item_sub_category' | 'item_type' | 'item_size' | 'item_weight' | 'gst_rate';

// Product type definition with UI specific fields
interface Product extends ProductBase {
  isEditing?: boolean;
  tempName?: string;
  tempDescription?: string;
  tempPrice?: string;
  tempUnit?: string;
  tempIsActive?: boolean;
  isActive?: boolean; // For backward compatibility
  field?: EditableField; // For tracking which field is being edited
}



// Type for the editing state
interface EditingState {
  productId: string;
  field: EditableField;
  value: any;
}

type NewProduct = Omit<Product, 'id' | 'created_at' | 'updated_at'>;

// Default values for a new product
const defaultNewProduct: NewProduct = {
  item_code: '',
  item_name: '',
  item_description: '',
  item_category: '',
  item_sub_category: '',
  item_type: '',
  item_size: '',
  item_unit: '',
  item_weight: 0,
  item_rate: 0,
  gst_rate: 0,
  is_active: true,
};

// Helper function to handle API errors
const handleApiError = (error: unknown, toast: (props: { title: string; description: string; variant?: 'destructive' }) => void) => {
  console.error('API Error:', error);
  const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again.';
  toast({
    title: 'Error',
    description: errorMessage,
    variant: 'destructive',
  });
};

// Memoized table row component to prevent unnecessary re-renders
const ProductRow = memo(({ 
  product, 
  onEdit, 
  onDeleteClick, 
  isSubmitting, 
  renderEditableCell, 
  toggleProductStatus 
}: { 
  product: Product; 
  onEdit: (product: Product, field: EditableField) => void; 
  onDeleteClick: (product: Product) => void; 
  isSubmitting: boolean; 
  renderEditableCell: (product: Product, field: EditableField) => JSX.Element; 
  toggleProductStatus: (id: string) => void; 
}) => (
  <TableRow>
    <TableCell>
      <div className="min-h-[32px] flex items-center px-2 py-1">
        <span className="flex-1">{product.item_name || '-'}</span>
      </div>
    </TableCell>
    <TableCell>{renderEditableCell(product, 'item_category')}</TableCell>
    <TableCell>{renderEditableCell(product, 'item_sub_category')}</TableCell>
    <TableCell>{renderEditableCell(product, 'item_type')}</TableCell>
    <TableCell>{renderEditableCell(product, 'item_size')}</TableCell>
    <TableCell>{renderEditableCell(product, 'item_unit')}</TableCell>
    <TableCell className="text-right">{renderEditableCell(product, 'item_weight')}</TableCell>
    <TableCell className="text-right">{renderEditableCell(product, 'item_rate')}</TableCell>
    <TableCell>
      <div className="flex justify-center">
        <Switch
          checked={product.is_active}
          onCheckedChange={() => toggleProductStatus(product.id)}
          className="data-[state=checked]:bg-green-500"
        />
      </div>
    </TableCell>
    <TableCell>{product.updated_at}</TableCell>
    <TableCell className="text-right">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDeleteClick(product)}
        disabled={isSubmitting}
        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </TableCell>
  </TableRow>
));

ProductRow.displayName = 'ProductRow';

export default function ProductCatalog() {
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();
  
  // State for products and loading
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [newProduct, setNewProduct] = useState<NewProduct>(defaultNewProduct);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  
  // Fetch products on component mount or when search/pagination changes
  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm]);
  
  // Fetch products from Supabase
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });
      
      // Apply search filter if search term exists
      if (searchTerm) {
        query = query.or(`item_name.ilike.%${searchTerm}%,item_code.ilike.%${searchTerm}%`);
      }
      
      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      // Map the data to include our UI-specific fields
      const formattedProducts = data.map((product: any) => ({
        ...product,
        is_active: product.is_active ?? true,
        updated_at: new Date(product.updated_at || product.created_at || new Date()).toLocaleDateString('en-GB'),
        gst_rate: Number(product.gst_rate || 0),
        item_rate: Number(product.item_rate || 0),
        item_weight: Number(product.item_weight || 0),
        tempName: product.item_name || '',
        tempDescription: product.item_description || '',
        tempPrice: product.item_rate?.toString() || '0',
        tempUnit: product.item_unit || 'kg',
        tempIsActive: product.is_active || false,
      }));
      
      setProducts(formattedProducts);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change with debounce
  const handleSearchChange = useCallback(debounce((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on new search
  }, 300), []);

  // Handle input change for new product
  const handleNewProductChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, type } = e.target;
    const target = e.target as HTMLInputElement; // Type assertion for checked property
    
    setNewProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? target.checked : target.value
    }));
  }, []);

  // Handle adding a new product
  const handleAddProduct = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!newProduct.item_name || !newProduct.item_code) {
        throw new Error('Product name and code are required');
      }
      
      // Prepare product data for submission
      const productData: Omit<NewProduct, 'is_active'> = {
        item_code: newProduct.item_code,
        item_name: newProduct.item_name,
        item_description: newProduct.item_description,
        item_category: newProduct.item_category,
        item_sub_category: newProduct.item_sub_category,
        item_type: newProduct.item_type,
        item_size: newProduct.item_size,
        item_unit: newProduct.item_unit,
        item_weight: parseFloat(newProduct.item_weight.toString()) || 0,
        item_rate: parseFloat(newProduct.item_rate.toString()) || 0,
        gst_rate: parseFloat(newProduct.gst_rate.toString()) || 0,
      };
      
      // Insert the new product
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select('*');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('No data returned from server');
      }
      
      // Update local state with the new product
      setProducts(prev => [
        {
          ...data[0],
          is_active: data[0].is_active ?? true,
          updated_at: new Date(data[0].updated_at || data[0].created_at || new Date()).toLocaleDateString('en-GB'),
          gst_rate: Number(data[0].gst_rate || 0),
          item_rate: Number(data[0].item_rate || 0),
          item_weight: Number(data[0].item_weight || 0),
          tempName: data[0].item_name || '',
          tempDescription: data[0].item_description || '',
          tempPrice: data[0].item_rate?.toString() || '0',
          tempUnit: data[0].item_unit || 'kg',
          tempIsActive: data[0].is_active || false,
        },
        ...prev
      ]);
      
      // Reset form and close dialog
      setNewProduct(defaultNewProduct);
      setIsAddDialogOpen(false);
      
      toast({
        title: 'Success',
        description: 'Product added successfully',
      });
      
    } catch (error: unknown) {
      console.error('Error adding product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add product';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [newProduct, supabase, toast]);

  // Handle saving edited field
  const handleSaveEdit = useCallback(async (productId: string) => {
    if (!editingState) return;
    
    try {
      setIsSubmitting(true);
      const { field, value } = editingState;
      
      // Update the product in the database
      const { error } = await supabase
        .from('products')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', productId);
      
      if (error) throw error;
      
      // Update the local state
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, [field]: value } : p
      ));
      
      setEditingState(null);
      
      toast({
        title: 'Success',
        description: 'Product updated successfully!',
      });
    } catch (error) {
      handleApiError(error, toast);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingState, supabase, toast]);

  // Handle input change for edited product (single declaration)
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { value, type } = e.target as HTMLInputElement;
    if (editingState) {
      setEditingState({
        ...editingState,
        value: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      });
    }
  }, [editingState]);

  // Handle key down for input fields (Enter to save, Escape to cancel)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && editingState) {
      e.preventDefault();
      handleSaveEdit(editingState.productId);
    } else if (e.key === 'Escape') {
      setEditingState(null);
    }
  }, [editingState, handleSaveEdit]);

  // Start editing a field
  const startEditingField = useCallback((productId: string, field: EditableField) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    setEditingState({
      productId,
      field,
      value: product[field]
    });
  }, [products]);

  // Cancel editing - only one declaration needed
  const cancelEditing = useCallback(() => {
    setEditingState(null);
  }, []);

  // Removed duplicate and flawed saveFieldEdit; using handleSaveEdit above

  // Memoize the debounced search function
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 300),
    []
  );
  
  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);
  
  // Handle delete confirmation
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle cancel delete
  const handleCancelDelete = () => {
    setProductToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  
  
  // Toggle product active status
  const toggleProductStatus = useCallback(async (productId: string) => {
    try {
      setIsSubmitting(true);
      const product = products.find(p => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      const newStatus = !product.is_active;
      
      const { error } = await supabase
        .from('products')
        .update({ 
          is_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);
        
      if (error) throw error;
      
      // Update local state
      setProducts(prevProducts => prevProducts.map(p => 
        p.id === productId ? { 
          ...p, 
          is_active: newStatus,
          updated_at: new Date().toISOString()
        } : p
      ));
      
      toast({
        title: 'Success',
        description: `Product marked as ${newStatus ? 'Active' : 'Inactive'}`,
      });
    } catch (error) {
      console.error('Error updating product status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update product status',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [products, supabase, toast]);

  // Handle delete button click (single declaration exists above)

  // Pagination change handler
  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }, [totalPages]);

  // Confirm delete handler for AlertDialog
  const handleConfirmDelete = useCallback(async () => {
    if (!productToDelete) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);
      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      toast({ title: 'Deleted', description: 'Product deleted successfully' });
    } catch (error) {
      handleApiError(error, toast);
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  }, [productToDelete, supabase, toast]);

  // Render editable cell using editingState
  const renderEditableCell = (product: Product, field: EditableField) => {
    const isEditing = !!editingState && editingState.productId === product.id && editingState.field === field;
    const isNumberField = ['item_weight', 'item_rate', 'gst_rate'].includes(field);
    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          <Input
            type={isNumberField ? 'number' : 'text'}
            step={isNumberField ? '0.01' : undefined}
            min={isNumberField ? '0' : undefined}
            name={field}
            value={editingState.value ?? ''}
            onChange={handleInputChange}
            onKeyDown={(e) => handleKeyDown(e)}
            autoFocus
            className={`h-8 w-full ${isNumberField ? 'text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none' : ''}`}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSaveEdit(product.id)}
            disabled={isSubmitting}
            className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelEditing}
            disabled={isSubmitting}
            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }
    return (
      <div
        className="flex items-center justify-between group cursor-pointer p-2 -m-2 rounded hover:bg-gray-100"
        onClick={() => startEditingField(product.id, field)}
      >
        <span className="text-inherit">{product[field]}</span>
        <Pencil className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white-900">Product Catalog</h1>
          <p className="text-sm text-white-500">
            Manage your product inventory and details
            {totalCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-600 text-white rounded-full text-xs font-medium">
                {totalCount} {totalCount === 1 ? 'item' : 'items'}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Input
              type="text"
              placeholder="Search products..."
              onChange={(e) => handleSearchChange((e.target as HTMLInputElement).value)}
              className="w-full pl-9 text-black"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            variant="default"
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <Card className="border-2 border-red-500 bg-white">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Sub Category</TableHead>
                  <TableHead>Item Type</TableHead>
                  <TableHead>Item Size</TableHead>
                  <TableHead>Item Unit</TableHead>
                  <TableHead className="text-right">Weight (kg)</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No products match your search.' : 'No products found. Add your first product to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <ProductRow 
                      key={product.id}
                      product={product}
                      onEdit={(p, field) => startEditingField(p.id, field)}
                      onDeleteClick={handleDeleteClick}
                      isSubmitting={isSubmitting}
                      renderEditableCell={renderEditableCell}
                      toggleProductStatus={toggleProductStatus}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalCount)}
                </span>{' '}
                of <span className="font-medium">{totalCount}</span> results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className={`w-10 h-10 p-0 ${currentPage === pageNum ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="px-2 py-1">...</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Fill in the details below to add a new product to the catalog.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="dialog_item_name" className="text-sm font-medium leading-none text-gray-700">
                Item Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="dialog_item_name"
                name="item_name"
                value={newProduct.item_name}
                onChange={handleNewProductChange}
                placeholder="Enter item name"
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="dialog_item_category" className="text-sm font-medium leading-none text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <Input
                  id="dialog_item_category"
                  name="item_category"
                  value={newProduct.item_category}
                  onChange={handleNewProductChange}
                  placeholder="Enter category"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dialog_item_sub_category" className="text-sm font-medium leading-none text-gray-700">
                  Sub Category
                </label>
                <Input
                  id="dialog_item_sub_category"
                  name="item_sub_category"
                  value={newProduct.item_sub_category}
                  onChange={handleNewProductChange}
                  placeholder="Enter sub category"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="dialog_item_type" className="text-sm font-medium leading-none text-gray-700">
                  Item Type <span className="text-red-500">*</span>
                </label>
                <Input
                  id="dialog_item_type"
                  name="item_type"
                  value={newProduct.item_type}
                  onChange={handleNewProductChange}
                  placeholder="Enter item type"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dialog_item_size" className="text-sm font-medium leading-none text-gray-700">
                  Item Size <span className="text-red-500">*</span>
                </label>
                <Input
                  id="dialog_item_size"
                  name="item_size"
                  value={newProduct.item_size}
                  onChange={handleNewProductChange}
                  placeholder="Enter item size"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="dialog_item_unit" className="text-sm font-medium leading-none text-gray-700">
                  Item Unit <span className="text-red-500">*</span>
                </label>
                <Input
                  id="dialog_item_unit"
                  name="item_unit"
                  value={newProduct.item_unit}
                  onChange={handleNewProductChange}
                  placeholder="e.g., kg, pcs"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dialog_item_weight" className="text-sm font-medium leading-none text-gray-700">
                  Weight (kg)
                </label>
                <Input
                  id="dialog_item_weight"
                  name="item_weight"
                  type="number"
                  value={newProduct.item_weight}
                  onChange={handleNewProductChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dialog_item_rate" className="text-sm font-medium leading-none text-gray-700">
                  Rate
                </label>
                <Input
                  id="dialog_item_rate"
                  name="item_rate"
                  type="number"
                  value={newProduct.item_rate}
                  onChange={handleNewProductChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
            <div className="space-y-2 flex items-end">
              <div className="flex items-center space-x-2">
                <Switch
                  id="dialog_is_active"
                  name="is_active"
                  checked={newProduct.is_active}
                  onCheckedChange={(checked) => 
                    setNewProduct(prev => ({ ...prev, is_active: checked }))
                  }
                />
                <label htmlFor="dialog_is_active" className="text-sm font-medium leading-none text-gray-700">Active</label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddProduct}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Product
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product "{productToDelete?.item_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
