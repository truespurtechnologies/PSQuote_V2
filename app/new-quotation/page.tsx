"use client";

import type React from "react"

// Force dynamic rendering since this page uses client-side auth
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Plus, Trash2, FileText, Eye, Printer, Truck, Receipt, Loader2, RotateCcw } from "lucide-react"
import { Label } from "@/components/ui/label"
import { ItemInput } from "@/components/ui/item-input"
import { QuotationPreview } from "@/components/quotation-preview"
import { LoadingSlipPreview } from "@/components/loading-slip-preview"
import { POSQuotationPreview } from "@/components/pos-quotation-preview"
import { POSLoadingSlipPreview } from "@/components/pos-loading-slip-preview"
import { QuotationItemsTable } from "@/components/quotation-items-table"
import { useAuth } from "@/components/auth/enhanced-auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { TablesInsert, Tables } from "@/types/database.types"

interface QuotationItem {
  id: string
  description: string
  requiredQty: number
  qtyInKgPc: number
  totalQtyKg: number
  unitRate: number
  totalValue: number
  productId?: string
}

// Define the database product type
type DBProduct = {
  id: string
  item_name: string | null
  item_weight: number | null
}

// Define our app's product type (non-null item_name)
interface Product {
  id: string
  item_name: string  // Non-null in our app
  item_weight?: number
}

interface QuotationItem {
  id: string
  description: string
  requiredQty: number
  qtyInKgPc: number
  totalQtyKg: number
  unitRate: number
  totalValue: number
  productId?: string
}

// Define initial form state outside the component
const getInitialFormState = () => ({
  quotationData: {
    to: "",
    phone: "",
    date: new Date().toISOString().split("T")[0],
    companyName: "POPULAR STEELS",
    accountNo: "8011 2011 0000 328",
    bankName: "BANK OF INDIA, GUINDY BRANCH",
    ifscCode: "BKID0008011",
  },
  items: Array(10).fill(0).map((_, index) => ({
    id: (index + 1).toString(),
    description: "",
    requiredQty: 0,
    qtyInKgPc: 0,
    totalQtyKg: 0,
    unitRate: 0,
    totalValue: 0,
    productId: undefined as string | undefined
  })),
  charges: {
    loading: 0,
    gstRate: 18,
    gstAmount: 0,
    grandTotal: 0,
    roundOff: 0
  },
  termsConditions: [
    "Payment : 100% Advance",
    "Weight & Value Approx Only.",
    "Transport extra & Unloading Extra,",
    "Today Rate Only,",
  ]
});

export default function NewQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state: { user } } = useAuth();

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showLoadingSlip, setShowLoadingSlip] = useState(false);
  const [showPOSQuotation, setShowPOSQuotation] = useState(false);
  const [showPOSLoadingSlip, setShowPOSLoadingSlip] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [editingCharges, setEditingCharges] = useState<Record<string, string>>({});
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const editId = searchParams?.get('edit') || null;
  const [savedQuotationNumber, setSavedQuotationNumber] = useState('');
  const [hasBeenSaved, setHasBeenSaved] = useState(!!editId); // True if editing existing quotation
  
  // Form State
  const [isFormModified, setIsFormModified] = useState(false);
  const [quotationData, setQuotationData] = useState(getInitialFormState().quotationData);
  const [items, setItems] = useState<QuotationItem[]>(getInitialFormState().items);
  const [charges, setCharges] = useState(getInitialFormState().charges);
  const [termsConditions, setTermsConditions] = useState(getInitialFormState().termsConditions);

  // Reset all preview dialogs
  const resetAllPreviews = () => {
    setShowPreview(false);
    setShowLoadingSlip(false);
    setShowPOSQuotation(false);
    setShowPOSLoadingSlip(false);
  };

  // Fetch products helper
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, item_name, item_weight')
        .order('item_name', { ascending: true });

      if (error) throw error;
      if (data) {
        // Convert DB products to our app's Product type, filtering out any with null names
        const validProducts: Product[] = [];
        
        for (const item of data) {
          if (item.item_name !== null) {
            validProducts.push({
              id: item.id,
              item_name: item.item_name,
              item_weight: item.item_weight ?? undefined
            });
          }
        }
        
        setProducts(validProducts);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to load product list",
        variant: "destructive",
      });
    } finally {
      setIsProductsLoading(false);
    }
  };

  // Load products when component mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  // Edit mode: load existing quotation and prefill form
  useEffect(() => {
    const loadForEdit = async () => {
      try {
        if (!editId) return;
        const { data: q, error } = await supabase
          .from('quotations')
          .select('*, quotation_items(*)')
          .eq('id', editId)
          .single();
        if (error) throw error;
        if (!q) return;

        // Prefill header
        setQuotationData(prev => ({
          ...prev,
          to: (q as any).customer_name || '',
          phone: (q as any).customer_phone || '',
          date: (q as any).date || new Date().toISOString().split('T')[0],
          companyName: (q as any).company_name || prev.companyName,
          accountNo: (q as any).account_no || prev.accountNo,
          bankName: (q as any).bank_name || prev.bankName,
          ifscCode: (q as any).ifsc_code || prev.ifscCode,
        }));

        // Prefill charges
        setCharges(prev => ({
          ...prev,
          loading: Number((q as any).loading_charges) || 0,
          gstRate: Number((q as any).gst_rate) || 18,
          roundOff: Number((q as any).round_off) || 0,
        }));

        // Prefill terms
        if (Array.isArray((q as any).terms_conditions)) {
          setTermsConditions((q as any).terms_conditions);
        }

        // Prefill items
        const qItems = Array.isArray((q as any).quotation_items) ? (q as any).quotation_items : [];
        const mappedItems: QuotationItem[] = qItems.map((it: any, idx: number) => ({
          id: String(idx + 1),
          description: it.description || '',
          requiredQty: Number(it.qty) || 0,
          qtyInKgPc: Number(it.qty_in_kg_pc) || 0,
          totalQtyKg: Number(it.total_qty_kg) || ((Number(it.qty) || 0) * (Number(it.qty_in_kg_pc) || 0)),
          unitRate: Number(it.unit_rate) || 0,
          totalValue: Number(it.total_value) || 0,
          productId: it.product_id || undefined,
        }));
        setItems(mappedItems.length ? mappedItems : [{
          id: '1', description: '', requiredQty: 0, qtyInKgPc: 0, totalQtyKg: 0, unitRate: 0, totalValue: 0
        }]);

        // Set quotation number into UI if needed
        const quotation = q as { quotation_number?: string };
        setSavedQuotationNumber(quotation.quotation_number || '');
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load quotation for edit', variant: 'destructive' });
      }
    };

    loadForEdit();
  }, [editId]);

  const handleQuotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setQuotationData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleItemChange = async (id: string, field: keyof QuotationItem, value: string | number) => {
    setItems(prevItems => {
      const index = prevItems.findIndex(item => item.id === id);
      if (index === -1) return prevItems;
      
      const newItems = [...prevItems];
      const currentItem = { ...newItems[index] };
      
      // Update the changed field with proper type handling
      if (field === 'description' && typeof value === 'string') {
        currentItem[field] = value;
        // Additionally, try to map description to a product exactly and auto-fill weight
        const byName = products.find(p => p.item_name.toLowerCase() === value.toLowerCase());
        if (byName) {
          currentItem.productId = byName.id;
          if (typeof byName.item_weight !== 'undefined') {
            currentItem.qtyInKgPc = byName.item_weight;
          }
          // Recalculate totals when description maps to a product
          currentItem.totalQtyKg = currentItem.requiredQty * currentItem.qtyInKgPc;
          currentItem.totalValue = currentItem.totalQtyKg * currentItem.unitRate;
          console.log('[handleItemChange] description matched product; auto-set', { id, productId: byName.id, qtyInKgPc: currentItem.qtyInKgPc });
        }
      } else if (field === 'productId' && typeof value === 'string') {
        console.log('[handleItemChange] Setting productId', { id, value });
        currentItem.productId = value || undefined;
        // When product changes, update weight and recalc totals
        const selectedProduct = products.find(p => p.id === value);
        if (selectedProduct?.item_weight !== undefined) {
          currentItem.qtyInKgPc = selectedProduct.item_weight;
        }
        currentItem.totalQtyKg = currentItem.requiredQty * currentItem.qtyInKgPc;
        currentItem.totalValue = currentItem.totalQtyKg * currentItem.unitRate;
      } else if (field === 'requiredQty' || field === 'qtyInKgPc' || field === 'unitRate') {
        // Ensure numeric fields are numbers
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
        (currentItem[field] as number) = numValue;
        
        // Recalculate dependent fields
        currentItem.totalQtyKg = currentItem.requiredQty * currentItem.qtyInKgPc;
        currentItem.totalValue = currentItem.totalQtyKg * currentItem.unitRate;
      } else if (field === 'totalQtyKg' || field === 'totalValue') {
        // These are calculated fields, don't allow direct updates
        return prevItems;
      } else if (field === 'id') {
        // Don't allow changing the ID
        return prevItems;
      }
      
      newItems[index] = currentItem;
      return newItems;
    });
  }

  const addItem = () => {
    const newId = (items.length + 1).toString()
    setItems((prev) => [
      ...prev,
      {
        id: newId,
        description: "",
        requiredQty: 0,
        qtyInKgPc: 0,
        totalQtyKg: 0,
        unitRate: 0,
        totalValue: 0,
        productId: undefined,
      },
    ])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const calculateTotals = () => {
    const totalWeight = items.reduce((sum, item) => sum + item.totalQtyKg, 0)
    const basicTotal = items.reduce((sum, item) => sum + item.totalValue, 0)
    const afterLoading = basicTotal + charges.loading
    const gstAmount = (afterLoading * charges.gstRate) / 100
    const beforeRounding = afterLoading + gstAmount
    const finalTotal = Math.round(beforeRounding)
    const roundOff = finalTotal - beforeRounding

    return {
      totalWeight,
      basicTotal,
      afterLoading,
      gstAmount,
      roundOff,
      finalTotal,
    }
  }

  const totals = calculateTotals()

  const handleTermChange = (index: number, value: string) => {
    setTermsConditions((prev) => prev.map((term, i) => (i === index ? value : term)))
  }

  const addTerm = () => {
    setTermsConditions((prev) => [...prev, ""])
  }

  const removeTerm = (index: number) => {
    if (termsConditions.length > 1) {
      setTermsConditions((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const generateQuotationNumber = async () => {
    try {
      const { data, error } = await (supabase as any).rpc('allocate_quotation_number', {
        prefix: 'QT-',
        width: 4,
      });
      if (error) throw error;
      return (data as string) || `QT-${Date.now().toString().slice(-6)}`;
    } catch (error) {
      console.error('Error allocating quotation number via RPC:', error);
      // Friendly feedback, but still fallback to keep flow unblocked
      toast({
        title: 'Notice',
        description: 'Unable to allocate quotation number — please try again. Using a temporary number for now.',
        variant: 'destructive',
      });
      // Fallback to timestamp-based number
      return `QT-${Date.now().toString().slice(-6)}`
    }
  }

  // Check if form has been modified
  useEffect(() => {
    const currentState = {
      quotationData,
      items: items.map(({ id, ...rest }) => rest), // Exclude id from comparison
      charges,
      termsConditions
    };

    const initialState = getInitialFormState();
    const isModified = 
      JSON.stringify(currentState.quotationData) !== JSON.stringify(initialState.quotationData) ||
      JSON.stringify(currentState.items) !== JSON.stringify(initialState.items) ||
      JSON.stringify(currentState.charges) !== JSON.stringify(initialState.charges) ||
      JSON.stringify(currentState.termsConditions) !== JSON.stringify(initialState.termsConditions);

    setIsFormModified(isModified);
  }, [quotationData, items, charges, termsConditions]);

  // Reset form to initial state
  const resetForm = () => {
    const initialState = getInitialFormState();
    setQuotationData(initialState.quotationData);
    setItems(JSON.parse(JSON.stringify(initialState.items)));
    setCharges(initialState.charges);
    setTermsConditions(initialState.termsConditions);
    
    // Reset any edit state
    if (editId) {
      router.push('/new-quotation');
    }
    
    // Close all previews
    resetAllPreviews();
  };

  const handleSubmit = async (e: React.FormEvent, shouldReset = false) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Use existing number in edit mode. For new quotations, DO NOT generate client-side; let DB trigger allocate.
      const quotationNumber = editId ? (savedQuotationNumber || (await generateQuotationNumber())) : undefined;

      // Ensure customer exists (create if new) and capture customer_id for quotation
      let customerId: string | null = null;
      
      const custName = (quotationData.to || '').trim();
      const custPhone = (quotationData.phone || '').trim();

      if (custName || custPhone) {
        // Try find by phone first (unique-enough), fallback by exact name
        let { data: existingByPhone, error: findErr1 } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', custPhone)
          .maybeSingle();

        if (findErr1) console.warn('[customers] find by phone error:', findErr1);

        const byPhone = existingByPhone as ({ id: string } | null);
        if (byPhone?.id) {
          customerId = byPhone.id;
        } else {
          let { data: existingByName, error: findErr2 } = await supabase
            .from('customers')
            .select('id')
            .ilike('name', custName)
            .maybeSingle();
          if (findErr2) console.warn('[customers] find by name error:', findErr2);

          const byName = existingByName as ({ id: string } | null);
          if (byName?.id) {
            customerId = byName.id;
          } else {
            // Insert new customer (minimal fields we have)
            if (!user?.id) {
              throw new Error('Missing user.id for creating customer');
            }
            const newCustomer: TablesInsert<'customers'> = {
              name: custName || 'Unknown',
              phone: custPhone || 'unknown',
              email: null,
              address: null,
              gstin: null,
              state_code: null,
              state_name: null,
              is_active: true,
              notes: null,
              created_by: user.id,
            };

            const { data: insertedCustomer, error: insertCustErr } = await supabase
              .from('customers')
              .insert<TablesInsert<'customers'>>(newCustomer)
              .select('id')
              .single();

            if (insertCustErr) {
              console.error('[customers] insert error:', insertCustErr);
              throw insertCustErr;
            }
            
            const ins = insertedCustomer as ({ id: string } | null);
            customerId = ins?.id ?? null;
          }
        }
      }
      
      // Calculate totals for DB (Option A):
      // subtotal = sum of item totals (basic only, no loading)
      // gst_amount = (subtotal + loading) * gst_rate
      // grand_total = subtotal + loading + gst_amount + round_off
      const basicTotalFromItems = items.reduce((sum, item) => {
        const totalQtyKg = (item.requiredQty || 0) * (item.qtyInKgPc || 0);
        const lineTotal = totalQtyKg * (item.unitRate || 0);
        return sum + lineTotal;
      }, 0);

      const subtotal = basicTotalFromItems;
      const taxableBase = subtotal + (charges.loading || 0);
      const gstAmount = taxableBase * ((charges.gstRate || 18) / 100);
      const grandTotal = subtotal + (charges.loading || 0) + gstAmount + (charges.roundOff || 0);

      // Format the data to match the database schema
      const quotationToSave: TablesInsert<'quotations'> = {
        // quotation_number intentionally omitted for insert; supplied only in edit path
        quotation_number: (quotationNumber as any),
        customer_name: (quotationData.to || '').trim() || 'Customer',
        customer_phone: quotationData.phone,
        customer_id: customerId,
        company_name: quotationData.companyName || 'POPULAR STEELS',
        account_no: quotationData.accountNo,
        bank_name: quotationData.bankName,
        ifsc_code: quotationData.ifscCode,
        date: new Date().toISOString().split('T')[0],
        subtotal: subtotal, // basic items total only
        loading_charges: charges.loading || 0,
        gst_rate: charges.gstRate || 18,
        gst_amount: gstAmount,
        round_off: charges.roundOff || 0,
        grand_total: grandTotal,
        status: 'draft',
        terms_conditions: termsConditions.filter(t => t.trim() !== ''),
        created_by: user?.id,
        // created_at and updated_at will be handled by the database
      };
      
      // Insert or Update quotation
      let targetQuotationId: string | null = null;
      if (editId) {
        // Update existing quotation (preserve quotation_number)
        const { data: updated, error: updateErr } = await supabase
          .from('quotations')
          .update({
            customer_name: quotationToSave.customer_name,
            customer_phone: quotationToSave.customer_phone,
            customer_id: quotationToSave.customer_id,
            company_name: quotationToSave.company_name,
            account_no: quotationToSave.account_no,
            bank_name: quotationToSave.bank_name,
            ifsc_code: quotationToSave.ifsc_code,
            date: quotationToSave.date,
            subtotal: quotationToSave.subtotal,
            loading_charges: quotationToSave.loading_charges,
            gst_rate: quotationToSave.gst_rate,
            gst_amount: quotationToSave.gst_amount,
            round_off: quotationToSave.round_off,
            grand_total: quotationToSave.grand_total,
            status: quotationToSave.status,
            terms_conditions: quotationToSave.terms_conditions,
            created_by: quotationToSave.created_by,
          })
          .eq('id', editId)
          .select('id, quotation_number')
          .single();
        if (updateErr) {
          console.error('[quotations.update] error:', updateErr);
          throw new Error(`[quotations.update] ${((updateErr as any)?.code || '')} ${(updateErr as any)?.message || 'Unknown error'}`);
        }
        targetQuotationId = updated?.id ?? editId;
      } else {
        // Attempt insert, and on unique violation retry once with a newly allocated number
        let insertData: any = { ...quotationToSave };
        // Ensure we do NOT send quotation_number so DB trigger can allocate it
        delete insertData.quotation_number;
        const attemptInsert = async () => {
          return await supabase
            .from('quotations')
            .insert(insertData)
            .select('id, quotation_number')
            .single();
        };

        let { data: savedQuotation, error: quoteError } = await attemptInsert();
        // With DB trigger allocation, duplicate should be extremely rare. Keep single retry safeguard if needed.
        if (quoteError && (quoteError as any)?.code === '23505') {
          console.warn('[quotations.insert] duplicate encountered unexpectedly, retrying once');
          ({ data: savedQuotation, error: quoteError } = await attemptInsert());
        }

        if (quoteError) {
          console.error('[quotations.insert] error:', quoteError);
          throw new Error(`[quotations.insert] ${((quoteError as any)?.code || '')} ${(quoteError as any)?.message || 'Unknown error'}`);
        }
        targetQuotationId = savedQuotation?.id ?? null;
        // Capture DB-allocated quotation number for UI
        if (savedQuotation?.quotation_number) {
          setSavedQuotationNumber(savedQuotation.quotation_number);
        }
      }
      
      // Save items to quotation_items table
      if (targetQuotationId && items.length > 0) {
        const itemsToSave: TablesInsert<'quotation_items'>[] = items
          .filter(item => item.description.trim() !== '' && item.requiredQty > 0)
          .map((item) => {
            const desc = (item.description || '').trim();
            const descLower = desc.toLowerCase();
            const sentinelId = products.find(p => p.item_name.toLowerCase().trim() === 'not found')?.id || null;

            // Prefer explicit selection
            let pid: string | null = item.productId || null;

            // Exact name match only (case-insensitive)
            if (!pid) {
              const exact = products.find(p => p.item_name.toLowerCase() === descLower);
              if (exact) {
                pid = exact.id;
              }
            }

            // If still not found, set placeholder as requested
            if (!pid) {
              pid = sentinelId; // use sentinel UUID if present
            }

            return {
              quotation_id: targetQuotationId,
              description: item.description,
              product_id: pid,
              qty: item.requiredQty,
              qty_in_kg_pc: item.qtyInKgPc || 0,
              unit_rate: item.unitRate || 0
              // total_qty_kg and total_value are generated columns in DB; do not include here
            } as TablesInsert<'quotation_items'>;
          });
        
        if (itemsToSave.length > 0) {
          if (editId) {
            // Replace existing items for this quotation id
            const { error: delErr } = await supabase
              .from('quotation_items')
              .delete()
              .eq('quotation_id', targetQuotationId);
            if (delErr) {
              console.error('[quotation_items.delete] error:', delErr);
              throw new Error(`[quotation_items.delete] ${((delErr as any)?.code || '')} ${(delErr as any)?.message || 'Unknown error'}`);
            }
          }
          
          const { error: itemsError } = await supabase
            .from('quotation_items')
            .insert(itemsToSave);
            
          if (itemsError) {
            console.error('[quotation_items.insert] error:', itemsError);
            throw new Error(`[quotation_items.insert] ${((itemsError as any)?.code || '')} ${(itemsError as any)?.message || 'Unknown error'}`);
          }
        }
      }
      
      // Show success message
      toast({
        title: "Success",
        description: `Quotation ${editId ? 'updated' : 'saved'} successfully!`,
      });
      
      // Show success dialog with print options (savedQuotationNumber already set for insert above)
      if (quotationNumber) {
        setSavedQuotationNumber(quotationNumber);
      }
      setShowSuccessDialog(true);
      setHasBeenSaved(true); // Mark as saved
      
      // Reset form if save and reset was clicked
      if (shouldReset) {
        resetForm();
      } else if (editId) {
        // If in edit mode, update the URL to remove the edit ID
        router.push('/new-quotation');
      }
      
    } catch (err) {
      // Ensure we log a useful structure
      try {
        const e: any = err;
        console.error('Error saving quotation:', {
          message: e?.message,
          code: e?.code,
          details: e?.details,
          hint: e?.hint,
          raw: e,
        });
      } catch {
        console.error('Error saving quotation (raw):', err);
      }
      
      let errorMessage = 'Failed to save quotation';
      
      // More specific error messages based on error type
      if (err && typeof err === 'object') {
        const error = err as { code?: string; message?: string };
        // 23505 - unique violation
        if (error.code === '23505' || /duplicate key value/i.test(error.message || '')) {
          errorMessage = 'A quotation with this number already exists';
        }
        // 42501 - permission denied
        else if (error.code === '42501' || /permission denied/i.test(error.message || '')) {
          errorMessage = 'Permissions issue — please contact admin';
        }
        // RPC-related
        else if (/allocate_quotation_number|rpc/i.test(error.message || '')) {
          errorMessage = 'Unable to allocate quotation number — please try again';
        }
        // Fallback to original message
        else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 10000, // 10 seconds for errors
      });
    } finally {
      setIsLoading(false);
    }

  }

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

  const handlePrintQuotation = () => {
    setShowPreview(true);
    setTimeout(() => {
      printContent('quotation-preview-content');
    }, 100);
  };

  const handlePrintLoadingSlip = () => {
    setShowLoadingSlip(true);
    setTimeout(() => {
      printContent('loading-slip-preview-content');
    }, 100);
  };

  const handlePOSQuotationPrint = () => {
    setShowPOSQuotation(true);
    setTimeout(() => {
      printContent('pos-quotation-preview-content');
    }, 100);
  };

  const handlePOSLoadingSlipPrint = () => {
    setShowPOSLoadingSlip(true);
    setTimeout(() => {
      printContent('pos-loading-slip-preview-content');
    }, 100);
  };

  const handlePreview = () => {
    setShowPreview(true)
    setShowLoadingSlip(false)
    setShowPOSQuotation(false)
    setShowPOSLoadingSlip(false)
  }

  const handleLoadingSlipPreview = () => {
    setShowLoadingSlip(true)
    setShowPreview(false)
    setShowPOSQuotation(false)
    setShowPOSLoadingSlip(false)
  }

  const handlePOSQuotationPreview = () => {
    setShowPOSQuotation(true)
    setShowPreview(false)
    setShowLoadingSlip(false)
    setShowPOSLoadingSlip(false)
  }

  const handlePOSLoadingSlipPreview = () => {
    setShowPOSLoadingSlip(true)
    setShowPreview(false)
    setShowLoadingSlip(false)
    setShowPOSQuotation(false)
  }


  if (showPreview) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white p-4 shadow-md print:hidden">
          <div className="container mx-auto flex justify-between items-center">
            <Button onClick={resetAllPreviews} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Form
            </Button>
            <div className="space-x-2">
              <Button onClick={handlePrintQuotation} className="bg-red-600 hover:bg-red-700 text-white">
                <Printer className="h-4 w-4 mr-2" />
                Print Quotation
              </Button>
              <Button onClick={handleLoadingSlipPreview} variant="outline">
                <Truck className="h-4 w-4 mr-2" />
                View Loading Slip
              </Button>
            </div>
          </div>
        </div>
        <div id="quotation-preview-content" className="print-content">
          <QuotationPreview
            quotationData={quotationData}
            items={items}
            charges={charges}
            termsConditions={termsConditions}
            totals={totals}
            quotationNumber={savedQuotationNumber || `QT-${Date.now().toString().slice(-6)}`}
          />
        </div>
      </div>
    )
  }

  if (showLoadingSlip) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white p-4 shadow-md print:hidden">
          <div className="container mx-auto flex justify-between items-center">
            <Button onClick={resetAllPreviews} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Form
            </Button>
            <div className="space-x-2">
              <Button onClick={handlePrintLoadingSlip} className="bg-red-600 hover:bg-red-700 text-white">
                <Printer className="h-4 w-4 mr-2" />
                Print Loading Slip
              </Button>
              <Button onClick={handlePreview} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View Quotation
              </Button>
            </div>
          </div>
        </div>
        <div id="loading-slip-preview-content" className="print-content">
          <LoadingSlipPreview
            quotationData={quotationData}
            items={items}
            totals={totals}
            quotationNumber={savedQuotationNumber || `QT-${Date.now().toString().slice(-6)}`}
          />
        </div>
      </div>
    )
  }

  if (showPOSQuotation) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white p-4 shadow-md print:hidden">
          <div className="container mx-auto flex justify-between items-center">
            <Button onClick={resetAllPreviews} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Form
            </Button>
            <div className="space-x-2">
              <Button onClick={handlePOSQuotationPrint} className="bg-red-600 hover:bg-red-700 text-white">
                <Printer className="h-4 w-4 mr-2" />
                Print POS Quotation
              </Button>
              <Button onClick={handlePOSLoadingSlipPreview} variant="outline">
                <Truck className="h-4 w-4 mr-2" />
                View POS Loading Slip
              </Button>
            </div>
          </div>
        </div>
        <div id="pos-quotation-preview-content" className="print-content">
          <POSQuotationPreview
            quotationData={quotationData}
            items={items}
            charges={charges}
            termsConditions={termsConditions}
            totals={totals}
            quotationNumber={savedQuotationNumber || `QT-${Date.now().toString().slice(-6)}`}
          />
        </div>
      </div>
    )
  }

  if (showPOSLoadingSlip) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white p-4 shadow-md print:hidden">
          <div className="container mx-auto flex justify-between items-center">
            <Button onClick={resetAllPreviews} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Form
            </Button>
            <div className="space-x-2">
              <Button onClick={handlePOSLoadingSlipPrint} className="bg-red-600 hover:bg-red-700 text-white">
                <Receipt className="h-4 w-4 mr-2" />
                Print POS Loading Slip
              </Button>
              <Button onClick={handlePOSQuotationPreview} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View POS Quotation
              </Button>
            </div>
          </div>
        </div>
        <div id="pos-loading-slip-preview-content" className="print-content">
          <POSLoadingSlipPreview
            quotationData={quotationData}
            items={items}
            totals={totals}
            quotationNumber={savedQuotationNumber || `QT-${Date.now().toString().slice(-6)}`}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md bg-gray-900 text-white">
          <DialogDescription className="sr-only">Quotation saved successfully</DialogDescription>
          <div className="flex flex-col items-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <DialogTitle className="text-xl font-semibold text-white">
              Success! 🎉
            </DialogTitle>
            <p className="mt-2 text-gray-300">
              Quotation <span className="font-medium text-white">{savedQuotationNumber}</span> has been saved successfully!
            </p>
            <div className="mt-6 w-full">
              <Button
                type="button"
                onClick={() => setShowSuccessDialog(false)}
                className="w-full justify-center bg-green-600 hover:bg-green-700 text-white"
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Header */}
      <header className="bg-white text-black shadow-lg border-b-4 border-red-500">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push("/landing")}
              variant="outline"
              size="sm"
              className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">New Quotation</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Create New Quotation</h2>
          <p className="text-gray-300">Fill in the details below to generate a professional quotation</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Information */}
          <Card className="bg-white border-2 border-red-500">
            <CardHeader>
              <CardTitle className="text-black flex items-center">
                <FileText className="h-5 w-5 mr-2 text-red-500" />
                Popular Steels - New Quotation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="to" className="text-black font-medium">
                    To (Client Name) *
                  </Label>
                  <Input
                    id="to"
                    name="to"
                    value={quotationData.to}
                    onChange={handleQuotationChange}
                    className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-black font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={quotationData.phone}
                    onChange={handleQuotationChange}
                    placeholder="PH:98410 43637"
                    className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-black font-medium">
                    Date *
                  </Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={quotationData.date}
                    onChange={handleQuotationChange}
                    className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card className="bg-white border-2 border-red-500">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-black">Quotation Items</CardTitle>
                  <CardDescription>
                    Type freely in the description field or click the dropdown arrow to see steel item suggestions.
                  </CardDescription>
                </div>
                <Button type="button" onClick={addItem} className="bg-red-600 hover:bg-red-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <QuotationItemsTable 
                items={items}
                onItemChange={handleItemChange}
                onRemoveItem={removeItem}
                products={products}
              />
            </CardContent>
          </Card>

          {/* Totals Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border-2 border-red-500">
              <CardHeader>
                <CardTitle className="text-black">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-black">Total Weight:</span>
                    <span className="text-black font-semibold">{totals.totalWeight.toFixed(2)} KG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Basic Total Value:</span>
                    <span className="text-black font-semibold">₹{totals.basicTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-red-500">
              <CardHeader>
                <CardTitle className="text-black">Additional Charges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-black">Loading Charges:</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={editingCharges['loading'] !== undefined 
                        ? editingCharges['loading'] 
                        : (charges.loading === 0 ? '' : charges.loading.toString())}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow numbers, single decimal point, and empty string
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setEditingCharges(prev => ({
                            ...prev,
                            loading: value
                          }));
                          
                          // Only update the parent state with valid numbers
                          const numValue = parseFloat(value);
                          if (!isNaN(numValue)) {
                            setCharges(prev => ({
                              ...prev,
                              loading: numValue
                            }));
                          } else if (value === '') {
                            setCharges(prev => ({
                              ...prev,
                              loading: 0
                            }));
                          }
                        }
                      }}
                      onBlur={() => {
                        // Clear the editing value on blur
                        setEditingCharges(prev => {
                          const newValues = { ...prev };
                          delete newValues['loading'];
                          return newValues;
                        });
                      }}
                      className="w-32 border-gray-300 focus:border-red-500 focus:ring-red-500 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-black">GST Rate (%):</Label>
                    <Input
                      type="number"
                      value={charges.gstRate}
                      onChange={(e) =>
                        setCharges((prev) => ({ ...prev, gstRate: Number.parseFloat(e.target.value) || 0 }))
                      }
                      className="w-32 border-gray-300 focus:border-red-500 focus:ring-red-500 text-right"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Final Totals */}
          <Card className="bg-white border-2 border-red-500">
            <CardHeader>
              <CardTitle className="text-black">Final Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-black">Subtotal:</span>
                  <span className="text-black font-semibold">₹{totals.afterLoading.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">GST @{charges.gstRate}%:</span>
                  <span className="text-black font-semibold">₹{totals.gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Rounded off:</span>
                  <span className="text-black font-semibold">₹{totals.roundOff.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t-2 border-red-500 pt-2">
                  <span className="text-black">Total Value Rs.:</span>
                  <span className="text-red-600">₹{totals.finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card className="bg-white border-2 border-red-500">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-black">Terms & Conditions</CardTitle>
                <Button type="button" onClick={addTerm} size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Term
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {termsConditions.map((term, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={term}
                      onChange={(e) => handleTermChange(index, e.target.value)}
                      className="flex-1 border-gray-300 focus:border-red-500 focus:ring-red-500"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTerm(index)}
                      disabled={termsConditions.length === 1}
                      className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={!hasBeenSaved && !editId}
              className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!hasBeenSaved && !editId ? "Please save the quotation first" : ""}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Quotation
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleLoadingSlipPreview}
              disabled={!hasBeenSaved && !editId}
              className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!hasBeenSaved && !editId ? "Please save the quotation first" : ""}
            >
              <Truck className="h-4 w-4 mr-2" />
              Preview Loading Slip
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handlePOSQuotationPreview}
              disabled={!hasBeenSaved && !editId}
              className="border-purple-600 text-purple-600 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!hasBeenSaved && !editId ? "Please save the quotation first" : ""}
            >
              <Receipt className="h-4 w-4 mr-2" />
              Preview POS Quotation
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handlePOSLoadingSlipPreview}
              disabled={!hasBeenSaved && !editId}
              className="border-orange-600 text-orange-600 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!hasBeenSaved && !editId ? "Please save the quotation first" : ""}
            >
              <Truck className="h-4 w-4 mr-2" />
              Preview POS Loading Slip
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={!isFormModified || isLoading}
              className="border-gray-400 text-gray-700 hover:bg-gray-100"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {editId ? 'Update' : 'Save'} Quotation
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
