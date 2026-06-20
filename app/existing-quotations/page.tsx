"use client"

// Force dynamic rendering since this page uses client-side auth
// This is a Next.js directive and needs to be a string literal
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../components/auth/enhanced-auth-context"
import { QuotationDB, type QuotationItem, type SavedQuotation, type IQuotationDB } from "../../lib/quotation-db"
import { supabase } from "../../lib/supabase/client"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { format } from "date-fns"
import { Search, Trash2, FileText, Loader2, ArrowLeft, Eye, Edit, Plus, AlertCircle, X } from "lucide-react"
import { useToast } from "../../components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert"
import { QuotationPreview } from "@/components/quotation-preview"
import { LoadingSlipPreview } from "@/components/loading-slip-preview"
import { POSQuotationPreview } from "@/components/pos-quotation-preview"
import { POSLoadingSlipPreview } from "@/components/pos-loading-slip-preview"
import { Printer, Truck, Receipt } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../../components/ui/dialog"

// Import product types for enrichment
interface Product {
  id: string
  item_name: string
  display_prefix?: string
  item_size?: string
}

type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'approved' | 'pending'

// Local interface to avoid conflict with imported SavedQuotation type
interface LocalSavedQuotation {
  id: string;
  quotation_number: string;
  company_name: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  date: string;
  subtotal: number;
  gst_amount: number;
  gst_rate: number;
  loading_charges: number;
  round_off: number;
  grand_total: number;
  notes: string | null;
  termsConditions: string[] | null;
  status: string;
  account_no: string | null;
  bank_name: string | null;
  ifsc_code: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  items?: Array<{
    id: string;
    quotation_id: string;
    product_id: string | null;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    created_at: string;
    updated_at: string;
    products?: {
      id: string;
      item_name: string;
      item_code: string;
      item_size: string;
      item_type: string;
      item_unit: string;
      item_weight: number;
      item_rate: number;
      gst_rate: number;
      hsn_code: string | null;
      item_category: string;
      item_sub_category: string | null;
      is_active: boolean | null;
      created_at: string;
      updated_at: string;
      created_by: string;
    } | null;
  }>;
}

interface FormattedQuotation {
  clientName: string;
  amount: string;
  status: QuotationStatus;
  date: string;
  description: string;
  rawData: SavedQuotation;
  formattedDate: string;
  formattedAmount: string;
  id: string;
  quotationNumber: string;
  customerName: string;
  customerId?: string;
  validUntil?: string;
  notes?: string;
  termsConditions: string[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  grandTotal?: number;
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  quotationData?: any;
  items?: QuotationItem[];
  charges?: any;
  totals?: any;
}

function ExistingQuotationsPage() {
  const { state: { user, session } } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<FormattedQuotation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(30);
  const [totalItems, setTotalItems] = useState<number>(0);
  
  // Add products state for enrichment
  const [products, setProducts] = useState<Product[]>([]);
  
  // Create a properly typed instance of QuotationDB that implements IQuotationDB
  const quotationDB: IQuotationDB = new QuotationDB();
  const [quotationToDelete, setQuotationToDelete] = useState<FormattedQuotation | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [previewQuotation, setPreviewQuotation] = useState<FormattedQuotation | null>(null)
  const [previewType, setPreviewType] = useState<'quotation' | 'loadingSlip' | 'posQuotation' | 'posLoadingSlip'>('quotation')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  
  // Initialize QuotationDB with the current session
  useEffect(() => {
    const init = async () => {
      if (!user || !session) {
        console.log('User not authenticated, using local storage only')
        setIsInitialized(true)
        setIsLoading(false)
        return
      }

      try {
        const initialized = await QuotationDB.initialize();
        if (!initialized) {
          setError('Failed to initialize quotation database');
          return;
        }
        setIsInitialized(true)
      } catch (error) {
        console.error('Initialization error:', error)
        setError('Failed to initialize quotation database');
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [user, session])

  // Fetch products for enrichment
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, item_name, display_prefix, item_size');
      
      if (error) {
        console.error('Error fetching products:', error);
        return;
      }
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, []);

  // Helper function to enrich items with product data for POS display
  const enrichItemsWithProductData = (items: any[]) => {
    return items.map(item => {
      let product = null;
      
      // First, try to match by productId
      if (item.productId) {
        product = products.find(p => p.id === item.productId);
      }
      
      // If no productId or not found, try to match by description (case-insensitive)
      if (!product && item.description) {
        // Normalize both descriptions: lowercase, trim, and normalize multiple spaces
        const normalizeDesc = (desc: string) => desc.toLowerCase().trim().replace(/\s+/g, ' ');
        const itemDescNormalized = normalizeDesc(item.description);
        
        product = products.find(p => {
          const productDescNormalized = normalizeDesc(p.item_name);
          return productDescNormalized === itemDescNormalized;
        });
      }
      
      // If product found, enrich with display data
      if (product) {
        console.log('[Existing Quotation Enrichment] Enriching item:', {
          description: item.description,
          displayPrefix: product.display_prefix,
          itemSize: product.item_size
        });
        
        return {
          ...item,
          displayPrefix: product.display_prefix,
          itemSize: product.item_size,
          productId: product.id // Also set productId for future reference
        };
      }
      
      console.log('[Existing Quotation Enrichment] No match found for:', item.description);
      return item;
    });
  };

  // Fetch products when component mounts
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Extended interface for database fields
  interface DatabaseQuotation {
    id: string;
    quotation_number: string;
    customer_id?: string;
    customer_name: string;
    created_at: string | Date;
    updated_at: string | Date;
    grand_total: number;
    subtotal: number;
    discount_amount?: number;
    tax_amount?: number;
    status: string;
    notes?: string;
    termsConditions?: string[];
    valid_until?: string;
    user_id?: string;
    created_by?: string;
    quotation_data?: any;
    items?: any[];
    charges?: any;
    // For backward compatibility with SavedQuotation
    quotationNumber?: string;
    customerId?: string;
    totalAmount?: number;
    quotationData?: any;
    [key: string]: any; // For any additional properties
  }

  // Format a raw quotation object into the expected FormattedQuotation type
  const formatQuotation = useCallback((raw: any): FormattedQuotation | null => {
    if (!raw) return null;
    
    try {
      // 1. Client Name - Use customer_name from database or fallback to customerName
      const clientName = raw.customer_name || raw.customerName || 'Unknown Client';
      
      // 2. Quotation Number - Use quotation_number or quotationNumber
      const quotationNumber = raw.quotation_number || raw.quotationNumber || '';
      
      // 3. Date - Use created_at or createdAt
      let formattedDate = 'Unknown date';
      try {
        const dateToFormat = raw.created_at || raw.createdAt || new Date();
        const date = dateToFormat instanceof Date ? dateToFormat : new Date(dateToFormat);
        if (!isNaN(date.getTime())) {
          formattedDate = format(date, 'MMM dd, yyyy');
        }
      } catch (e) {
        console.warn('Error formatting date:', e);
      }
      
      // 4. Amount - Use grand_total or totalAmount
      const totalAmount = raw.grand_total || raw.totalAmount || 0;
      const amount = `₹${Number(totalAmount).toLocaleString('en-IN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
      
      // 5. Status - Use status or default to 'draft'
      const status = raw.status || 'draft';

      // 6. Process items if they exist
      // First check if items exist in the raw data, then check quotation_items
      const items = raw.items || raw.quotation_items || [];
      const formattedItems = items.length > 0 
        ? items.map((item: any) => ({
            id: item.id || '',
            description: item.products?.item_name || item.description || 'No description',
            requiredQty: Number(item.quantity) || 0,
            qtyInKgPc: Number(item.products?.item_weight) || 1,
            totalQtyKg: Number(item.total_qty_kg) || (Number(item.quantity) || 0) * (Number(item.products?.item_weight) || 1),
            unitRate: Number(item.unit_price) || 0,
            totalValue: Number(item.total) || 0,
            product: item.products || null
          }))
        : [];
      
      // If no items but we have a subtotal, create a dummy item
      if (formattedItems.length === 0 && raw.subtotal) {
        formattedItems.push({
          id: 'dummy-item',
          description: 'Item details not available',
          requiredQty: 1,
          qtyInKgPc: 1,
          totalQtyKg: 1,
          unitRate: raw.subtotal,
          totalValue: raw.subtotal,
          product: null
        });
      }
      
      // 7. Calculate totals if not provided
      const subtotal = raw.subtotal || formattedItems.reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0);
      const taxAmount = raw.tax_amount || raw.taxAmount || 0;
      const discountAmount = raw.discount_amount || raw.discountAmount || 0;
      
      // Create a new object with all required properties
      const formattedQuotation: FormattedQuotation = {
        clientName,
        amount,
        status,
        date: formattedDate,
        description: raw.notes || `Quotation #${quotationNumber || 'N/A'}`,
        formattedDate,
        formattedAmount: amount,
        rawData: {
          id: raw.id,
          quotationNumber: quotationNumber,
          customerId: raw.customer_id || raw.customerId || '',
          date: formattedDate,
          validUntil: raw.valid_until || raw.validUntil,
          status: status,
          notes: raw.notes,
          termsConditions: raw.termsConditions || [],
          subtotal: subtotal,
          discountAmount: discountAmount,
          taxAmount: taxAmount,
          totalAmount: totalAmount,
          userId: raw.user_id || raw.userId || raw.created_by || '',
          createdAt: raw.created_at || raw.createdAt || new Date(),
          updatedAt: raw.updated_at || raw.updatedAt || new Date(),
          quotationData: raw.quotation_data || raw.quotationData || {}
        } as SavedQuotation,
        id: raw.id,
        quotationNumber,
        items: formattedItems,
        customerName: clientName,
        customerId: raw.customer_id || raw.customerId,
        validUntil: raw.valid_until || raw.validUntil,
        notes: raw.notes,
        termsConditions: raw.terms_conditions || raw.termsConditions || [],
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        grandTotal: totalAmount,
        userId: raw.user_id || raw.userId || raw.created_by || '',
        createdAt: raw.created_at || raw.createdAt || new Date(),
        updatedAt: raw.updated_at || raw.updatedAt || new Date(),
        quotationData: raw.quotation_data || raw.quotationData || {},
        charges: raw.charges || {
          loading: raw.loading_charges || 0,
          gstRate: raw.gst_rate || 18,
          roundOff: raw.round_off || 0
        },
        totals: {
          totalWeight: formattedItems.reduce((sum: number, item: any) => sum + (item.totalQtyKg || 0), 0),
          basicTotal: subtotal,
          afterLoading: subtotal + (raw.loading_charges || 0),
          gstAmount: taxAmount,
          roundOff: raw.round_off || 0,
          finalTotal: totalAmount
        }
      };
      
      return formattedQuotation;
    } catch (error) {
      console.error('Error formatting quotation:', error, raw);
      return null;
    }
  }, [])

  // Load quotations from the database or localStorage (with server-side pagination when available)
  const loadQuotations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use server-side pagination (Supabase) when available
      const { data: pageData, total } = await QuotationDB.getQuotationsPage(currentPage, itemsPerPage);

      // Safely map quotations with proper error handling
      const formattedQuotations = pageData
        .map(q => formatQuotation(q as unknown as DatabaseQuotation))
        .filter((q): q is FormattedQuotation => q !== null);

      setTotalItems(total);
      setQuotations(formattedQuotations);

      return formattedQuotations;
    } catch (error) {
      console.error('Error loading quotations:', error);
      
      // Try to load from localStorage as a last resort
      try {
        const localData = localStorage.getItem('popular_steels_quotations');
        if (localData) {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed)) {
            const formattedLocal = parsed
              .map((q: any) => formatQuotation(q as SavedQuotation))
              .filter((q): q is FormattedQuotation => q !== null);
            
            setQuotations(formattedLocal);
            return formattedLocal;
          }
        }
      } catch (e) {
        console.error('Error loading from localStorage:', e);
      }
      
      // If we get here, all loading attempts failed
      setError('Failed to load quotations. Please check your connection and try again.');
      
      return [];
    } finally {
      setIsLoading(false)
    }
  }, [user, formatQuotation, setIsLoading, currentPage, itemsPerPage, setError])

  // Load quotations when component mounts or user changes
  useEffect(() => {
    const loadQuotes = async () => {
      try {
        if (!isInitialized) {
          const initialized = await QuotationDB.initialize();
          if (!initialized) {
            setError('Failed to initialize quotation database');
            return;
          }
          setIsInitialized(true);
        }
        
        loadQuotations();
      } catch (err) {
        console.error('Error initializing QuotationDB:', err);
        setError('Failed to initialize quotation database');
      }
    };
    
    loadQuotes();
  }, [isInitialized, loadQuotations, setError]);

  // Handle quotation deletion
  const handleDeleteQuotation = useCallback(async () => {
    if (!quotationToDelete) return;
    
    setIsDeleting(true);
    try {
      const success = await quotationDB.deleteQuotation(quotationToDelete.id);
      if (success) {
        // Update local state only if deletion was successful
        setQuotations(prev => prev.filter(q => q.id !== quotationToDelete.id));
      } else {
        throw new Error('Failed to delete quotation');
      }
      
      setError(null);
    } catch (error) {
      console.error('Error deleting quotation:', error);
      setError('Failed to delete quotation');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setQuotationToDelete(null);
    }
  }, [quotationToDelete, setError, setQuotations, setIsDeleting, setIsDeleteDialogOpen, setQuotationToDelete])

  // Filter and paginate quotations (client-side filter on current page data)
  const { currentItems, totalPages, filteredQuotations } = useMemo(() => {
    // Filter based on search term within the currently loaded page
    const filtered = searchTerm.trim() 
      ? quotations.filter((quote: FormattedQuotation) => {
          if (!quote) return false;
          const searchLower = searchTerm.toLowerCase();
          return (
            (quote.clientName || '').toLowerCase().includes(searchLower) ||
            (quote.id || '').toLowerCase().includes(searchLower) ||
            (quote.description || '').toLowerCase().includes(searchLower) ||
            (quote.quotationNumber || '').toLowerCase().includes(searchLower) ||
            (quote.status || '').toLowerCase().includes(searchLower) ||
            (quote.amount || '').toLowerCase().includes(searchLower)
          );
        })
      : quotations;

    // totalPages is based on totalItems reported by the backend/local fallback
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const currentPageSafe = Math.min(Math.max(1, currentPage), totalPages);

    // Data is already paginated from the backend; just use the filtered subset
    const currentItems = filtered;
    
    return { 
      currentItems, 
      totalPages, 
      currentPage: currentPageSafe,
      filteredQuotations: filtered 
    };
  }, [quotations, searchTerm, currentPage, itemsPerPage, totalItems]);
  
  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleDeleteClick = useCallback((quotation: FormattedQuotation) => {
    setQuotationToDelete(quotation);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!quotationToDelete) return;
    
    try {
      setIsDeleting(true);
      
      const success = await quotationDB.deleteQuotation(quotationToDelete.id);
      
      if (success) {
        // Update the local state only if deletion was successful
        setQuotations(prev => prev.filter(q => q.id !== quotationToDelete.id));
      } else {
        throw new Error('Failed to delete quotation');
      }
      
      toast({
        title: 'Success',
        description: 'Quotation deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting quotation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete quotation',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setQuotationToDelete(null);
    }
  };

  const getStatusColor = useCallback((status: QuotationStatus) => {
    const colors: Record<QuotationStatus, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    
    return colors[status] || 'bg-gray-100 text-gray-800';
  }, []);

  // StatusBadge component for displaying quotation status with theme colors
  const StatusBadge = ({ status }: { status: QuotationStatus }) => {
    const statusColors = {
      draft: 'bg-white text-black border border-black',
      sent: 'bg-white text-black border border-black',
      accepted: 'bg-white text-black border border-black',
      approved: 'bg-white text-black border border-black',
      rejected: 'bg-red-600 text-white border border-red-700',
      expired: 'bg-black text-white border border-gray-800',
      pending: 'bg-white text-red-600 border border-red-600'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[status] || 'bg-white text-black border'}`}>
        {status}
      </span>
    );
  };

  const handleCancelDelete = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setQuotationToDelete(null);
  }, []);

  const handleDelete = async () => {
    if (!quotationToDelete) return;
    
    setIsDeleting(true);
    try {
      const success = await quotationDB.deleteQuotation(quotationToDelete.id);
      
      if (success) {
        setQuotations(prev => prev.filter(q => q.id !== quotationToDelete.id));
        toast({
          title: 'Success',
          description: 'Quotation deleted successfully',
          variant: 'default',
        });
      } else {
        throw new Error('Failed to delete quotation');
      }
    } catch (error) {
      console.error('Error deleting quotation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete quotation',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setQuotationToDelete(null);
    }
  };

  // Preview handlers
  const handlePreview = useCallback(async (quotation: FormattedQuotation, type: 'quotation' | 'loadingSlip' | 'posQuotation' | 'posLoadingSlip' = 'quotation') => {
    try {
      console.log(`[handlePreview] Previewing ${type} with ID:`, quotation.id);
      
      // Fetch quotation with items from Supabase
      const { data: fullQuotation, error } = await supabase
        .from('quotations')
        .select('*, quotation_items(*)')
        .eq('id', quotation.id)
        .single();

      if (error) {
        console.error('[handlePreview] Error fetching quotation:', error);
        throw error;
      }

      console.log('[handlePreview] Fetched full quotation:', fullQuotation);

      if (!fullQuotation) {
        console.error('[handlePreview] No quotation data returned');
        toast({
          title: 'Error',
          description: 'Failed to load quotation details',
          variant: 'destructive',
        });
        return;
      }

      // Process items if they exist
      const items = fullQuotation.quotation_items || [];
      console.log('[handlePreview] Raw items from API:', items);

      const processedItems = items.map((item: any) => ({
        id: item.id,
        description: item.description || '',
        requiredQty: Number(item.qty) || 0,
        qtyInKgPc: Number(item.qty_in_kg_pc) || 0,
        totalQtyKg: Number(item.total_qty_kg) || 0,
        unitRate: Number(item.unit_rate) || 0,
        totalValue: Number(item.total_value) || 0
      }));

      console.log('[handlePreview] Processed items:', processedItems);

      // Create a properly formatted quotation object
      const formattedQuotation: FormattedQuotation = {
        ...quotation, // Keep the original formatted fields
        items: processedItems,
        rawData: fullQuotation as unknown as SavedQuotation, // Cast to SavedQuotation
        clientName: fullQuotation.customer_name || 'Unknown Client',
        amount: fullQuotation.grand_total?.toString() || '0',
        status: (fullQuotation.status as QuotationStatus) || 'draft',
        date: fullQuotation.date || new Date().toISOString(),
        description: fullQuotation.quotation_number || `Quotation #${fullQuotation.id?.substring(0, 8) || ''}`,
        formattedDate: fullQuotation.date ? format(new Date(fullQuotation.date), 'MMM dd, yyyy') : 'N/A',
        formattedAmount: `₹${Number(fullQuotation.grand_total || 0).toLocaleString('en-IN')}`,
        quotationNumber: fullQuotation.quotation_number || '',
        customerName: fullQuotation.customer_name || '',
        customerId: fullQuotation.customer_id || undefined,
        subtotal: fullQuotation.subtotal || 0,
        discountAmount: 0, // Not in the database schema
        taxAmount: fullQuotation.gst_amount || 0, // Using gst_amount instead of tax_amount
        totalAmount: fullQuotation.grand_total || 0,
        grandTotal: fullQuotation.grand_total || 0,
        userId: fullQuotation.created_by || '', // Using created_by instead of user_id
        createdAt: fullQuotation.created_at ? new Date(fullQuotation.created_at) : new Date(),
        updatedAt: fullQuotation.updated_at ? new Date(fullQuotation.updated_at) : new Date(),
        termsConditions: Array.isArray(fullQuotation.terms_conditions) ? fullQuotation.terms_conditions : [],
        notes: fullQuotation.notes || undefined
      };

      setPreviewQuotation(formattedQuotation);
      setPreviewType(type);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('[handlePreview] Error in preview:', error);
      toast({
        title: 'Error',
        description: 'Failed to open preview: ' + (error as Error).message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewQuotation(null);
    setPreviewType('quotation');
  }, []);

  const renderPreview = () => {
    if (!previewQuotation) return null;

    console.log('Raw previewQuotation data:', previewQuotation);
    
    const commonProps = {
      quotationData: {
        to: previewQuotation.customerName || 'Customer',
        phone: (previewQuotation.rawData as any)?.customer_phone || '',
        date: previewQuotation.date,
        companyName: 'Popular Steels',
        accountNo: (previewQuotation.rawData as any)?.account_no || '',
        bankName: (previewQuotation.rawData as any)?.bank_name || '',
        ifscCode: (previewQuotation.rawData as any)?.ifsc_code || ''
      },
      items: (() => {
        console.log('Raw items data from previewQuotation:', previewQuotation.rawData?.items);
        
        const items = Array.isArray(previewQuotation.items) 
          ? previewQuotation.items 
          : (previewQuotation.rawData?.items || []).map((item: any) => {
              // Log the raw item data for debugging
              console.log('Raw item data:', JSON.stringify(item, null, 2));
              
              // Try to get description from various possible locations
              const description = item.description || 
                               item.products?.item_name || 
                               item.product?.item_name ||
                               item.products?.description ||
                               item.product?.description ||
                               item.name ||
                               item.item_name ||
                               'Item details not available';
              
              // Log all possible description sources
              console.log('Description sources:', {
                item_description: item.description,
                products_item_name: item.products?.item_name,
                product_item_name: item.product?.item_name,
                products_description: item.products?.description,
                product_description: item.product?.description,
                name: item.name,
                item_name: item.item_name,
                final_description: description
              });

              // Log the complete item structure for debugging
              console.log('Complete item structure:', {
                ...item,
                products: item.products ? '...' : null,
                product: item.product ? '...' : null
              });

              return {
                id: item.id || `item-${Math.random().toString(36).substr(2, 8)}`,
                description: description,
                requiredQty: Number(item.qty) || Number(item.quantity) || 0,
                qtyInKgPc: Number(item.qty_in_kg_pc) || Number(item.products?.item_weight) || Number(item.product?.item_weight) || 1,
                totalQtyKg: Number(item.total_qty_kg) || (Number(item.qty) || Number(item.quantity) || 0) * (Number(item.qty_in_kg_pc) || Number(item.products?.item_weight) || Number(item.product?.item_weight) || 1),
                unitRate: Number(item.unit_rate) || Number(item.unit_price) || 0,
                totalValue: Number(item.total_value) || Number(item.total) || 0,
                product: item.products || item.product || null,
                // Include raw item data for debugging
                _rawItem: item
              };
            });

        console.log('Processed items for preview:', JSON.parse(JSON.stringify(items)));
        const filteredItems = items.filter(item => item.description !== 'Item details not available');
        console.log('Filtered items (after removing unavailable):', filteredItems);
        
        // Enrich items with product data for POS display
        const enrichedItems = enrichItemsWithProductData(filteredItems);
        console.log('Enriched items for POS display:', enrichedItems);
        
        return enrichedItems;
      })(),
      charges: {
        loading: Number((previewQuotation.rawData as any)?.loading_charges) || 0,
        gstAmount: Number((previewQuotation.rawData as any)?.gst_amount) || 0,
        gstRate: Number((previewQuotation.rawData as any)?.gst_rate) || 18,
        roundOff: Number((previewQuotation.rawData as any)?.round_off) || 0
      },
      termsConditions: (() => {
        if (Array.isArray(previewQuotation.termsConditions)) {
          return previewQuotation.termsConditions;
        } else if (typeof previewQuotation.rawData?.termsConditions === 'string') {
          return (previewQuotation.rawData.termsConditions as string).split('\n').filter(Boolean);
        } else if (Array.isArray(previewQuotation.rawData?.termsConditions)) {
          return previewQuotation.rawData.termsConditions;
        }
        return [
          'Goods once sold will not be taken back or exchanged.',
          'Payment to be made in full before delivery.',
          'Interest @ 18% p.a. will be charged on overdue payments.'
        ];
      })(),
      totals: {
        totalWeight: previewQuotation.items?.reduce((sum, item) => {
          const weight = (item as any)?.totalQtyKg || 
                       (Number((item as any)?.quantity) || 0) * 
                       (Number((item as any)?.products?.item_weight) || 0);
          return sum + weight;
        }, 0) || 0,
        basicTotal: previewQuotation.subtotal || 0,
        afterLoading: (previewQuotation.subtotal || 0) + ((previewQuotation.rawData as any)?.loading_charges || 0),
        gstAmount: previewQuotation.taxAmount || 0,
        roundOff: (previewQuotation.rawData as any)?.round_off || 0,
        finalTotal: previewQuotation.grandTotal || previewQuotation.totalAmount || 0
      },
      quotationNumber: previewQuotation.quotationNumber || `QT-${previewQuotation.id.substring(0, 6).toUpperCase()}`
    };

    switch (previewType) {
      case 'loadingSlip':
        return <LoadingSlipPreview {...commonProps} />;
      case 'posQuotation':
        return <POSQuotationPreview {...commonProps} />;
      case 'posLoadingSlip':
        return <POSLoadingSlipPreview {...commonProps} />;
      case 'quotation':
      default:
        return <QuotationPreview {...commonProps} />;
    }
  };

  const printContent = (contentId: string) => {
    // Find the content to print
    const contentToPrint = document.getElementById(contentId);
    if (!contentToPrint) return;
    
    // Create a print container
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    
    // Clone the content to print
    const contentClone = contentToPrint.cloneNode(true) as HTMLElement;
    
    // Create a print stylesheet
    const printStyles = document.createElement('style');
    printStyles.textContent = `
      @page {
        size: A4;
        margin: 10mm;
      }
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }
      .print-content {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
      }
      .no-print {
        display: none !important;
      }
    `;
    
    // Hide all elements except the print container
    const style = document.createElement('style');
    style.textContent = `
      body > *:not(#print-container) {
        display: none !important;
      }
      #print-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
      }
    `;
    
    // Add everything to the document
    printContainer.appendChild(printStyles);
    printContainer.appendChild(contentClone);
    document.body.appendChild(printContainer);
    
    // Function to clean up after printing
    const cleanup = () => {
      document.body.removeChild(printContainer);
      document.head.removeChild(style);
      window.removeEventListener('afterprint', cleanup);
    };
    
    // Set up the afterprint event
    window.addEventListener('afterprint', cleanup);
    
    // Add the style to hide other elements
    document.head.appendChild(style);
    
    // Trigger the print dialog
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrint = () => {
    // Ensure the preview content is visible before printing
    setTimeout(() => {
      const contentId = `preview-content-${previewType}`;
      printContent(contentId);
    }, 100);
  };

// ... (rest of the code remains the same)
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-black text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()}
              className="text-white hover:bg-red-600 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-white">Quotations</h1>
          </div>
          <Button 
            onClick={() => router.push('/new-quotation')}
            className="bg-red-600 hover:bg-red-700 text-white border border-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Quotation
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <Input
                type="search"
                placeholder="Search by client name, quotation #, or status..."
                className="pl-10 w-full bg-white border-2 border-black focus-visible:ring-red-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                className="whitespace-nowrap bg-white text-black border-2 border-black hover:bg-red-50 hover:text-red-700"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border-2 border-dashed border-black">
            <Loader2 className="h-10 w-10 animate-spin text-red-600 mb-4" />
            <h3 className="text-lg font-medium text-black mb-1">Loading Quotations</h3>
            <p className="text-sm text-gray-700">Fetching your latest quotations...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && currentItems.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-black">
            <FileText className="mx-auto h-12 w-12 text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-black">
              {searchTerm ? 'No matching quotations' : 'No quotations yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-700 max-w-md mx-auto">
              {searchTerm 
                ? 'No quotations match your search. Try adjusting your filters.'
                : 'Get started by creating a new quotation.'}
            </p>
            <div className="mt-6">
              <Button 
                onClick={() => router.push('/new-quotation')}
                className="inline-flex items-center px-4 py-2 border-2 border-black text-sm font-medium rounded-sm shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                New Quotation
              </Button>
            </div>
          </div>
        )}

        {/* Quotations List */}
        {!isLoading && currentItems.length > 0 && (
          <div className="overflow-hidden bg-white shadow-sm rounded-lg border-2 border-black">
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-white uppercase tracking-wider bg-black">
              <div className="col-span-4">Client / Quotation #</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2"></div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {currentItems.map((quotation: FormattedQuotation) => (
                <div key={quotation.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 sm:p-3 hover:bg-red-50 transition-colors">
                  {/* Client Info */}
                  <div className="sm:col-span-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-sm bg-red-100 text-red-700 border border-black">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-black line-clamp-1">
                          {quotation.clientName}
                        </div>
                        <div className="text-xs text-gray-600">
                          #{quotation.quotationNumber}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Date */}
                  <div className="sm:col-span-2 flex items-center text-sm text-black">
                    {quotation.formattedDate}
                  </div>
                  
                  {/* Amount */}
                  <div className="sm:col-span-2 flex items-center justify-end">
                    <span className="text-sm font-medium text-black">
                      {quotation.formattedAmount}
                    </span>
                  </div>
                  
                  {/* Status */}
                  <div className="sm:col-span-2 flex items-center justify-center">
                    <StatusBadge status={quotation.status} />
                  </div>
                  
                  {/* Actions */}
                  <div className="sm:col-span-2 flex items-center justify-end space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-black hover:bg-red-100 hover:text-red-700"
                      onClick={() => handlePreview(quotation)}
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Preview</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-black hover:bg-red-100 hover:text-red-700"
                      onClick={() => router.push(`/new-quotation?edit=${quotation.id}`)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700"
                      onClick={() => {
                        setQuotationToDelete(quotation);
                        setIsDeleteDialogOpen(true);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Controls (match Product Catalog style/behavior) */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between px-2 sm:px-0">
            <div className="text-sm text-gray-500">
              Showing{' '}
              <span className="font-medium">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{' '}
              of{' '}
              <span className="font-medium">{totalItems}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-white"
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
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
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className={`w-10 h-10 p-0 ${
                        currentPage === pageNum
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-white'
                      }`}
                      onClick={() => paginate(pageNum)}
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
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="bg-white"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Delete Quotation?
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete the quotation for <span className="font-medium text-gray-900 dark:text-white">{quotationToDelete?.clientName}</span> (Quotation #{quotationToDelete?.quotationNumber})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <Button 
              onClick={handleDelete}
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : 'Delete Quotation'}
            </Button>
            <Button 
              variant="outline" 
              className="mt-3 w-full sm:mt-0 sm:mr-3 sm:w-auto"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
          <DialogTitle className="sr-only">
            Preview: {previewQuotation?.quotationNumber || (previewQuotation?.id ? `QT-${previewQuotation.id.substring(0, 6).toUpperCase()}` : 'Quotation')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Preview dialog showing quotation details and options to print or change view
          </DialogDescription>
          {previewQuotation && (
            <div className="flex flex-col h-full">
              {/* Preview Header */}
              <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={closePreview}
                    className="rounded-full hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                  </Button>
                  <h2 className="text-lg font-semibold">
                    Preview: {previewQuotation.quotationNumber || `QT-${previewQuotation.id.substring(0, 6).toUpperCase()}`}
                  </h2>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant={previewType === 'quotation' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handlePreview(previewQuotation, 'quotation')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Quotation
                  </Button>
                  <Button 
                    variant={previewType === 'loadingSlip' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handlePreview(previewQuotation, 'loadingSlip')}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Loading Slip
                  </Button>
                  <Button 
                    variant={previewType === 'posQuotation' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handlePreview(previewQuotation, 'posQuotation')}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    POS Quotation
                  </Button>
                  <Button 
                    variant={previewType === 'posLoadingSlip' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handlePreview(previewQuotation, 'posLoadingSlip')}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    POS Loading Slip
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handlePrint}
                    className="ml-4"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
              
              {/* Preview Content */}
              <div className="flex-1 overflow-auto p-6">
                <div id={`preview-content-${previewType}`}>
                  {renderPreview()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExistingQuotationsPage;
