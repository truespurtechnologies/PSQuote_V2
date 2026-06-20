// External Dependencies
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

// Add JSX namespace
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    interface Element extends React.ReactElement {}
  }
}
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, X, Check, Pencil, Save } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import debounce from 'lodash.debounce';

// Type Definitions
interface Product {
  id: string;
  item_code: string;
  item_name: string;
  item_category: string;
  item_sub_category: string;
  item_type: string;
  item_size: string;
  display_prefix: string | null;
  item_unit: string;
  item_weight: number;
  item_rate: number;
  gst_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type NewProduct = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
type EditableField = keyof Omit<NewProduct, 'is_active'>;

// Default values for a new product
const defaultNewProduct: NewProduct = {
  item_code: '',
  item_name: '',
  item_category: '',
  item_sub_category: '',
  item_type: '',
  item_size: '',
  display_prefix: null,
  item_unit: '',
  item_weight: 0,
  item_rate: 0,
  gst_rate: 0,
  is_active: true,
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
    <TableCell>{renderEditableCell(product, 'display_prefix')}</TableCell>
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

export const ProductCatalog = () => {
  // Initialize toast
  const { toast } = useToast();
  
  // State for the component
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingField, setEditingField] = useState<{ id: string; field: EditableField } | null>(null);
  const [editedProduct, setEditedProduct] = useState<Partial<Product>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<NewProduct>(defaultNewProduct);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Disable Save until required fields are valid or while submitting
  const isSaveDisabled = useMemo(() => {
    const required = [
      // item_name is generated by DB; do not require from user
      newProduct.item_category,
      newProduct.item_type,
      newProduct.item_size,
      newProduct.item_unit,
    ];
    const anyMissing = required.some(v => typeof v !== 'string' || v.trim() === '');
    return isSubmitting || anyMissing;
  }, [newProduct, isSubmitting]);

  // Fetch products from Supabase
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Build the query
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      
          // Add search filter if search term exists
      if (searchTerm) {
        query = query.or(
          `item_name.ilike.%${searchTerm}%,` +
          `item_category.ilike.%${searchTerm}%,` +
          `item_sub_category.ilike.%${searchTerm}%,` +
          `item_type.ilike.%${searchTerm}%`
        ) as any; // Type assertion needed for Supabase query builder
      }
      
      // Add pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;

      if (error) throw error;
      
      // Transform and validate the data; coerce nullable strings to '' to satisfy Product type
      const formattedProducts = (data || []).map((product: any) => ({
        id: product.id,
        item_code: product.item_code || '',
        item_name: product.item_name || '',
        item_category: product.item_category || '',
        item_sub_category: product.item_sub_category || '',
        item_type: product.item_type || '',
        item_size: product.item_size || '',
        display_prefix: product.display_prefix || null,
        item_unit: product.item_unit || '',
        item_weight: Number(product.item_weight || 0),
        item_rate: Number(product.item_rate || 0),
        gst_rate: Number(product.gst_rate || 0),
        is_active: product.is_active ?? true,
        created_at: product.created_at || new Date().toISOString(),
        updated_at: new Date(product.updated_at || product.created_at || new Date()).toLocaleDateString('en-GB'),
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
  }, [supabase, toast, searchTerm, currentPage]);



  // Handle search input change with debounce
  const handleSearchChange = useCallback(
    debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setCurrentPage(1); // Reset to first page on search
    }, 300),
    []
  );

  // Handle input change for new product (only updates state)
  const handleNewProductChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let inputValue: string | number | boolean = value;
    
    if (type === 'number') {
      inputValue = parseFloat(value) || 0;
    } else if (type === 'checkbox') {
      inputValue = (e.target as HTMLInputElement).checked;
    }
    
    const updatedProduct: any = {
      ...newProduct,
      [name]: inputValue
    };

    // Auto-generate item name only when type, size AND unit are all provided
    if (['item_type', 'item_size', 'item_unit'].includes(name)) {
      const { item_type, item_size, item_unit } = updatedProduct as any;
      if (item_type && item_size && item_unit) {
        updatedProduct.item_name = `${String(item_type).trim()} ${String(item_size).trim()} ${String(item_unit).trim()}`;
      } else {
        updatedProduct.item_name = '';
      }
    }

    setNewProduct(updatedProduct);
  }, [newProduct]);

  // Build a fallback item code when the user doesn't provide one (DB requires NOT NULL)
  const buildItemCode = useCallback(() => {
    const slug = (s: string) => s
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const parts = [newProduct.item_type, newProduct.item_size, newProduct.item_unit]
      .filter(Boolean)
      .map((p) => slug(String(p)));
    const base = parts.join('-') || slug(newProduct.item_name) || 'AUTO';
    const suffix = Date.now().toString(36).toUpperCase().slice(-5);
    return `${base}-${suffix}`;
  }, [newProduct]);

  // Handle adding a new product (auth + validation + insert)
  const handleAddProduct = useCallback(async () => {
    try {
      // Prevent duplicate clicks
      if (isSubmitting) return;
      setIsSubmitting(true);

      // Auth session (required for created_by and RLS)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Auth session error:', sessionError);
        toast({ title: 'Authentication Error', description: 'Please refresh and try again.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      if (!session) {
        toast({ title: 'Authentication Required', description: 'Please sign in to add a product.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }

      // Validation per requirements
      const requiredFields = [
        // Item Name is generated by DB; do not require from user
        { field: 'item_category', name: 'Category' },
        { field: 'item_type', name: 'Item Type' },
        { field: 'item_size', name: 'Item Size' },
        { field: 'item_unit', name: 'Item Unit' },
      ];
      for (const { field, name } of requiredFields) {
        const value = newProduct[field as keyof NewProduct];
        if (!value || (typeof value === 'string' && !value.trim())) {
          toast({ title: 'Validation Error', description: `${name} is required`, variant: 'destructive' });
          setIsSubmitting(false);
          return;
        }
      }

      // Do NOT send item_name: DB enforces DEFAULT/generated value
      const productData: any = {
        item_code: newProduct.item_code?.trim() ? newProduct.item_code.trim() : buildItemCode(),
        item_category: newProduct.item_category.trim(),
        item_sub_category: (newProduct.item_sub_category?.trim() || null),
        item_type: (newProduct.item_type?.trim() || null),
        item_size: (newProduct.item_size?.trim() || null),
        item_unit: newProduct.item_unit.trim(),
        item_weight: Number(newProduct.item_weight) || 0,
        item_rate: Number(newProduct.item_rate) || 0,
        gst_rate: Number(newProduct.gst_rate) || 0,
        is_active: newProduct.is_active,
        created_by: session.user.id,
      };

      console.log('Inserting product data:', productData);
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .throwOnError();

      console.log('Insert response:', { data, error });
      if (error) {
        console.error('Supabase error:', { error, code: (error as any)?.code, message: (error as any)?.message, details: (error as any)?.details, hint: (error as any)?.hint });
        try { console.error('Supabase error json:', JSON.stringify(error)); } catch {}
        throw error;
      }

      if (data && data.length > 0) {
        const row: any = data[0];
        const newProductData: Product = {
          id: row.id,
          item_code: row.item_code || '',
          item_name: row.item_name || '',
          item_category: row.item_category || '',
          item_sub_category: row.item_sub_category || '',
          item_type: row.item_type || '',
          item_size: row.item_size || '',
          display_prefix: row.display_prefix || null,
          item_unit: row.item_unit || '',
          item_weight: Number(row.item_weight || 0),
          item_rate: Number(row.item_rate || 0),
          gst_rate: Number(row.gst_rate || 0),
          is_active: row.is_active ?? true,
          created_at: row.created_at || new Date().toISOString(),
          updated_at: new Date(row.updated_at || row.created_at || new Date()).toLocaleDateString('en-GB'),
        };

        setProducts(prev => [newProductData, ...prev]);
        setTotalCount(prev => prev + 1);
        setNewProduct(defaultNewProduct);
        setIsAddDialogOpen(false);
        toast({ title: 'Success', description: 'Product added successfully!' });
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to add product. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }, [newProduct, supabase, toast, buildItemCode]);

  // Handle page change with validation
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  }, [totalPages]);

  // Fetch products on component mount or when search/page changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, searchTerm, currentPage]);

  // Handle input change for edited product
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let inputValue: string | number | boolean = value;
    
    if (type === 'number') {
      inputValue = parseFloat(value) || 0;
    } else if (type === 'checkbox') {
      inputValue = (e.target as HTMLInputElement).checked;
    }
    
    setEditedProduct(prev => ({
      ...prev,
      [name]: inputValue
    }));
  }, []);

  // Handle key down for input fields
  const handleKeyDown = useCallback((e: React.KeyboardEvent, productId: string, field: EditableField) => {
    if (e.key === 'Enter') {
      saveFieldEdit(productId, field);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  }, []);
  
  // Start editing a field
  const startEditingField = useCallback((product: Product, field: EditableField) => {
    setEditingField({ id: product.id, field });
    setEditedProduct({ [field]: product[field] });
  }, []);
  
  // Save field edit to database
  const saveFieldEdit = useCallback(async (productId: string, field: EditableField) => {
    if (!editedProduct[field] && editedProduct[field] !== 0) {
      setEditingField(null);
      return;
    }

    try {
      // Update in database
      const { error } = await supabase
        .from('products')
        .update({ 
          [field]: editedProduct[field],
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;

      // Update local state
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === productId
            ? { 
                ...p, 
                [field]: editedProduct[field], 
                updated_at: new Date().toISOString() 
              }
            : p
        )
      );

      // Reset editing state
      setEditingField(null);
      setEditedProduct({});

      toast({
        title: 'Success',
        description: 'Product updated successfully!',
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: error instanceof Error 
          ? `Failed to update product: ${error.message}`
          : 'Failed to update product. Please try again.',
        variant: 'destructive',
      });
    }
  }, [editedProduct, supabase, toast]);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingField(null);
    setEditedProduct({});
  }, []);
  
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
  
  // Handle delete button click
  const handleDeleteClick = useCallback((product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  }, []);

  // Handle confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!productToDelete) return;
    
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);
        
      if (error) throw error;
      
      // Update local state
      setProducts(prevProducts => 
        prevProducts.filter(p => p.id !== productToDelete.id)
      );
      
      toast({
        title: 'Success',
        description: 'Product deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [productToDelete, supabase, toast]);

  // Render editable cell
  const renderEditableCell = (product: Product, field: EditableField) => {
    const isEditing = editingField?.id === product.id && editingField.field === field;
    
    if (isEditing) {
      // Special handling for number fields (weight and rate)
      const isNumberField = ['item_weight', 'item_rate', 'gst_rate'].includes(field);
      
      return (
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            name={field}
            value={editedProduct[field] ?? ''}
            onChange={handleInputChange}
            onKeyDown={(e) => handleKeyDown(e, product.id, field)}
            autoFocus
            className={`h-8 w-full ${isNumberField ? 'text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none' : ''}`}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => saveFieldEdit(product.id, field)}
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
        onClick={() => startEditingField(product, field)}
      >
        <span className="text-inherit">{product[field] ?? '-'}</span>
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
              onChange={handleSearchChange}
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
                  <TableHead>Display Prefix</TableHead>
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
                      onEdit={startEditingField}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="dialog_item_name" className="text-sm font-medium leading-none text-gray-700">
                  Item Name (auto-generated)
                </label>
                <Input
                  id="dialog_item_name"
                  name="item_name"
                  value={newProduct.item_name}
                  readOnly
                  aria-readonly
                  placeholder="Will auto-generate from Item Type, Item Size and Item Unit"
                  className="bg-gray-50"
                />
              </div>
              {/* Item Code field removed as per requirement
              <div className="space-y-2">
                <label htmlFor="dialog_item_code" className="text-sm font-medium leading-none text-gray-700">
                  Item Code <span className="text-red-500">*</span>
                </label>
                <Input
                  id="dialog_item_code"
                  name="item_code"
                  value={newProduct.item_code}
                  onChange={handleNewProductChange}
                  placeholder="Enter item code"
                  required
                />
              </div>
              */}
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
                  required
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
                  required
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
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
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
                  required
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
                  value={newProduct.item_weight === 0 ? '' : newProduct.item_weight}
                  onChange={handleNewProductChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dialog_item_rate" className="text-sm font-medium leading-none text-gray-700">
                  Rate (₹)
                </label>
                <Input
                  id="dialog_item_rate"
                  name="item_rate"
                  type="number"
                  value={newProduct.item_rate === 0 ? '' : newProduct.item_rate}
                  onChange={handleNewProductChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dialog_gst_rate" className="text-sm font-medium leading-none text-gray-700">
                  GST Rate (%)
                </label>
                <Input
                  id="dialog_gst_rate"
                  name="gst_rate"
                  type="number"
                  value={newProduct.gst_rate === 0 ? '' : newProduct.gst_rate}
                  onChange={handleNewProductChange}
                  placeholder="0.00"
                  min="0"
                  max="100"
                  step="0.01"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="dialog_is_active"
                name="is_active"
                checked={newProduct.is_active}
                onCheckedChange={(checked) => 
                  setNewProduct(prev => ({ ...prev, is_active: checked }))
                }
                className="data-[state=checked]:bg-green-500"
              />
              <label htmlFor="dialog_is_active" className="text-sm font-medium leading-none text-gray-700">
                Active Product
              </label>
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
              disabled={isSaveDisabled}
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
