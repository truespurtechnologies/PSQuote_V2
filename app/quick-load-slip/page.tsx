"use client"

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { useEnhancedAuth } from "../../hooks/use-enhanced-auth";
import { Button } from "../../components/ui/button";
import { ItemInput } from "../../components/ui/item-input";
import { toast } from "../../hooks/use-toast";
import { LoadingSlipPreview } from "../../components/loading-slip-preview";
import { POSLoadingSlipPreview } from "../../components/pos-loading-slip-preview";
import { ArrowLeft, Printer, Truck, Receipt, Trash2, Eye, Pencil } from "lucide-react";

// Types aligned with existing preview components
interface Product {
  id: string;
  item_name: string;
  item_weight: number; // kg per pc
  display_prefix?: string;
  item_size?: string;
}

interface ItemRow {
  id: string; // local row id
  productId?: string;
  description: string;
  qtyInKgPc: number; // from selected product weight
  requiredQty: number; // user input count
  totalQtyKg: number; // computed = qtyInKgPc * requiredQty
}

export default function QuickLoadSlipPage() {
  const router = useRouter();
  const { state: { user, loading: authLoading } } = useEnhancedAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSlipId, setSavedSlipId] = useState<string | null>(null);
  const [savedSlipNumber, setSavedSlipNumber] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'view'>(() => 'create');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirectedFrom=/quick-load-slip');
    }
  }, [user, authLoading, router]);

  // Header fields
  const [to, setTo] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const companyName = "POPULAR STEELS";
  const [slipNumber, setSlipNumber] = useState<string>("QLS-1");

  // Rows (start with 5 empty rows)
  const [rows, setRows] = useState<ItemRow[]>(() => Array.from({ length: 5 }, () => makeEmptyRow()));

  // Refs for keyboard navigation
  const headerFieldsRef = useRef<Record<string, HTMLInputElement | null>>({});
  const itemFieldsRef = useRef<Record<string, HTMLInputElement | null>>({});

  // Keyboard navigation handler for header fields (Delivery To, Phone, Date)
  const handleHeaderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, fieldIndex: number) => {
    const fields = ['to', 'phone', 'date'];
    let newFieldIndex = fieldIndex;

    switch (e.key) {
      case 'ArrowRight':
      case 'Enter':
        if (fieldIndex < fields.length - 1) {
          e.preventDefault();
          newFieldIndex = fieldIndex + 1;
        }
        break;
      
      case 'ArrowLeft':
        if (fieldIndex > 0) {
          e.preventDefault();
          newFieldIndex = fieldIndex - 1;
        }
        break;
      
      default:
        return;
    }

    const targetInput = headerFieldsRef.current[fields[newFieldIndex]];
    if (targetInput) {
      targetInput.focus();
      targetInput.select();
    }
  };

  // Keyboard navigation handler for item fields
  const handleItemKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, fieldIndex: number) => {
    const fields = ['qtyInKgPc', 'requiredQty'];
    const totalRows = rows.length;
    const totalFields = fields.length;

    let newRowIndex = rowIndex;
    let newFieldIndex = fieldIndex;

    switch (e.key) {
      case 'ArrowRight':
        if (fieldIndex < totalFields - 1) {
          e.preventDefault();
          newFieldIndex = fieldIndex + 1;
        }
        break;
      
      case 'ArrowLeft':
        if (fieldIndex > 0) {
          e.preventDefault();
          newFieldIndex = fieldIndex - 1;
        }
        break;
      
      case 'ArrowDown':
        if (rowIndex < totalRows - 1) {
          e.preventDefault();
          newRowIndex = rowIndex + 1;
        }
        break;
      
      case 'ArrowUp':
        if (rowIndex > 0) {
          e.preventDefault();
          newRowIndex = rowIndex - 1;
        }
        break;
      
      case 'Enter':
        e.preventDefault();
        if (fieldIndex < totalFields - 1) {
          newFieldIndex = fieldIndex + 1;
        } else if (rowIndex < totalRows - 1) {
          newRowIndex = rowIndex + 1;
          newFieldIndex = 0;
        }
        break;
      
      default:
        return;
    }

    const targetKey = `${rows[newRowIndex].id}-${fields[newFieldIndex]}`;
    const targetInput = itemFieldsRef.current[targetKey];
    if (targetInput) {
      targetInput.focus();
      targetInput.select();
    }
  };

  function makeEmptyRow(): ItemRow {
    return {
      id: crypto.randomUUID(),
      productId: undefined,
      description: "",
      qtyInKgPc: 0,
      requiredQty: 0,
      totalQtyKg: 0,
    };
  }

  // Fetch products
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, item_name, item_weight, display_prefix, item_size")
          .order("item_name", { ascending: true });
        if (error) throw error;
        setProducts((data || []) as Product[]);
      } catch (e: any) {
        console.error("Failed to load products", e);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // Generate next Quick Load Slip number QLS-<int>
  useEffect(() => {
    const gen = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("loading_slips")
          .select("slip_number")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        const latest = (data as { slip_number?: string } | null)?.slip_number || "";
        const match = latest.match(/^QLS-(\d+)$/);
        const next = match ? parseInt(match[1], 10) + 1 : 1;
        setSlipNumber(`QLS-${next}`);
      } catch (e) {
        console.warn("Failed to generate slip number, using default", e);
        setSlipNumber(`QLS-${Date.now().toString().slice(-5)}`);
      }
    };
    gen();
  }, []);

  // ========== View Tab State & Actions ==========
  type SlipRow = { id: string; slip_number: string; to_name: string | null; created_at: string };
  const [slips, setSlips] = useState<SlipRow[]>([]);
  const [slipsLoading, setSlipsLoading] = useState(false);

  const loadSlips = async () => {
    try {
      setSlipsLoading(true);
      const { data, error } = await (supabase as any)
        .from('loading_slips')
        .select('id, slip_number, to_name, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSlips((data || []) as SlipRow[]);
    } catch (e) {
      console.error('Failed to load slips', e);
      toast({ title: 'Error', description: 'Failed to load slips', variant: 'destructive' });
    } finally {
      setSlipsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'view') {
      loadSlips();
    }
  }, [activeTab]);

  const handleViewSlip = async (id: string) => {
    try {
      // Fetch slip and items
      const { data: slip, error: slipErr } = await (supabase as any)
        .from('loading_slips')
        .select('id, slip_number, to_name, phone, date, created_at')
        .eq('id', id)
        .single();
      if (slipErr) throw slipErr;
      const { data: items, error: itemsErr } = await (supabase as any)
        .from('loading_slip_items')
        .select('product_id, item_name, qty_in_kg_pc, required_qty, total_qty_kg')
        .eq('slip_id', id);
      if (itemsErr) throw itemsErr;

      // Populate state for preview
      setSavedSlipId(slip.id);
      setSavedSlipNumber(slip.slip_number);
      setTo(slip.to_name || '');
      setPhone(slip.phone || '');
      setDate((slip.date || '').slice(0, 10) || new Date().toISOString().slice(0, 10));

      const mapped: ItemRow[] = (items || []).map((it: any) => ({
        id: crypto.randomUUID(),
        productId: it.product_id || undefined,
        description: it.item_name || '',
        qtyInKgPc: Number(it.qty_in_kg_pc) || 0,
        requiredQty: Number(it.required_qty) || 0,
        totalQtyKg: Number(it.total_qty_kg) || 0,
      }));
      setRows(mapped.length ? mapped : Array.from({ length: 5 }, () => makeEmptyRow()));

      // Open preview
      setShowLoadingSlip(true);
    } catch (e) {
      console.error('Failed to open slip', e);
      toast({ title: 'Error', description: 'Failed to open slip for viewing', variant: 'destructive' });
    }
  };

  const handleEditSlip = async (id: string) => {
    try {
      // Reuse view logic to populate form, then switch to create tab
      await handleViewSlip(id);
      setShowLoadingSlip(false);
      setActiveTab('create');
      toast({ title: 'Ready', description: 'Slip loaded for editing' });
    } catch {}
  };

  const handleDeleteSlip = async (id: string) => {
    try {
      // Delete items, then slip
      const { error: delItemsErr } = await (supabase as any)
        .from('loading_slip_items')
        .delete()
        .eq('slip_id', id);
      if (delItemsErr) throw delItemsErr;
      const { error: delSlipErr } = await (supabase as any)
        .from('loading_slips')
        .delete()
        .eq('id', id);
      if (delSlipErr) throw delSlipErr;
      toast({ title: 'Deleted', description: 'Load slip deleted' });
      await loadSlips();
    } catch (e) {
      console.error('Delete failed', e);
      toast({ title: 'Error', description: 'Failed to delete slip', variant: 'destructive' });
    }
  };

  // Handlers
  const updateRowProduct = (rowId: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const qtyInKgPc = product?.item_weight || 0;
        const description = product?.item_name || "";
        const totalQtyKg = round3(qtyInKgPc * (r.requiredQty || 0));
        return { ...r, productId, description, qtyInKgPc, totalQtyKg };
      })
    );
  };

  const updateRowRequiredQty = (rowId: string, requiredQty: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const totalQtyKg = round3((r.qtyInKgPc || 0) * (requiredQty || 0));
        return { ...r, requiredQty, totalQtyKg };
      })
    );
  };

  const addRow = () => setRows((prev) => [...prev, makeEmptyRow()]);
  const removeRow = (rowId: string) => setRows((prev) => prev.filter((r) => r.id !== rowId));
  const resetAll = () => {
    setTo("");
    setPhone("");
    setDate(new Date().toISOString().slice(0, 10));
    setSlipNumber("QT-QUICK");
    setRows(Array.from({ length: 5 }, () => makeEmptyRow()));
    setError(null);
  };

  const totals = useMemo(() => {
    const totalWeight = rows.reduce((sum, r) => sum + (r.totalQtyKg || 0), 0);
    return { totalWeight };
  }, [rows]);

  // Sentinel product id for free-text entries that don't match existing products
  const sentinelProductId = useMemo(() => {
    const p = products.find(p => p.item_name.toLowerCase().trim() === 'not found');
    return p?.id || null;
  }, [products]);

  const hasValidItems = rows.some((r) => r.description.trim() !== "" && r.requiredQty > 0);

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
        
        // First try exact match
        product = products.find(p => {
          const productDescNormalized = normalizeDesc(p.item_name);
          return productDescNormalized === itemDescNormalized;
        });
        
        // If no exact match, try partial match (description starts with product name)
        // This handles cases where user adds custom text after the product name
        if (!product) {
          product = products.find(p => {
            const productDescNormalized = normalizeDesc(p.item_name);
            return itemDescNormalized.startsWith(productDescNormalized);
          });
        }
      }
      
      // If product found, enrich with display data
      if (product) {
        return {
          ...item,
          displayPrefix: product.display_prefix,
          itemSize: product.item_size,
          productId: product.id, // Also set productId for future reference
          productName: product.item_name // Store original product name for user text extraction
        };
      }
      
      return item;
    });
  };

  // Save to Supabase
  const saveSlip = async () => {
    try {
      setSaving(true);
      setError(null);

      // Create or update parent slip
      // Check if user is authenticated
      if (!user?.id) {
        setError("You must be logged in to save a loading slip");
        toast({ title: "Error", description: "Please log in to continue", variant: "destructive" });
        return;
      }

      let slipId = savedSlipId;
      let slipNum = savedSlipNumber || slipNumber;
      if (!slipId) {
        // Regenerate slip number right before insert to ensure uniqueness
        let finalSlipNumber = slipNumber;
        try {
          const { data: latestSlip } = await (supabase as any)
            .from("loading_slips")
            .select("slip_number")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          const latest = latestSlip?.slip_number || "";
          const match = latest.match(/^QLS-(\d+)$/);
          const next = match ? parseInt(match[1], 10) + 1 : 1;
          finalSlipNumber = `QLS-${next}`;
          setSlipNumber(finalSlipNumber); // Update state for UI
        } catch (e) {
          console.warn("Failed to regenerate slip number, using existing", e);
        }

        const insertData = {
          to_name: to.trim() || null,
          phone: phone.trim() || null,
          date: date || new Date().toISOString().slice(0, 10),
          slip_number: finalSlipNumber,
          total_weight: totals.totalWeight,
          created_by: user.id,
        };
        
        console.log("Attempting to insert loading slip:", {
          insertData,
          userObject: user,
          userId: user?.id,
          userIdType: typeof user?.id
        });
        
        const { data: slip, error: slipErr } = await (supabase as any)
          .from("loading_slips")
          .insert(insertData)
          .select("id, slip_number")
          .single();
        if (slipErr) {
          console.error("Insert loading_slips failed", {
            error: slipErr,
            message: slipErr?.message,
            code: slipErr?.code,
            details: slipErr?.details,
            hint: slipErr?.hint,
            user_id: user.id,
            slip_number: slipNumber
          });
          setError(`Failed to save: ${slipErr?.message || 'Unknown error'}`);
          toast({ 
            title: "Save Failed", 
            description: slipErr?.message || "Unknown error occurred", 
            variant: "destructive" 
          });
          return;
        }
        slipId = slip.id as string;
        slipNum = slip.slip_number as string;
        setSavedSlipId(slipId);
        setSavedSlipNumber(slipNum);
      } else {
        const { error: updErr } = await (supabase as any)
          .from("loading_slips")
          .update({
            to_name: to.trim() || null,
            phone: phone.trim() || null,
            date: date || new Date().toISOString().slice(0, 10),
            total_weight: totals.totalWeight,
          })
          .eq("id", slipId);
        if (updErr) {
          console.error("Update loading_slips failed", updErr);
          throw updErr;
        }
      }

      // Prepare items
      const items = rows
        .filter((r) => r.description.trim() !== "" && r.requiredQty > 0)
        .map((r) => ({
          slip_id: slipId,
          product_id: r.productId || null,
          item_name: r.description,
          qty_in_kg_pc: r.qtyInKgPc,
          required_qty: r.requiredQty,
          total_qty_kg: r.totalQtyKg,
        }));

      if (items.length > 0 && slipId) {
        // Replace existing items for this slip
        await (supabase as any).from("loading_slip_items").delete().eq("slip_id", slipId);
        const { error: itemsErr } = await (supabase as any).from("loading_slip_items").insert(items);
        if (itemsErr) {
          console.error("Insert loading_slip_items failed", itemsErr);
          throw itemsErr;
        }
      }
      // Success toast consistent with New Quotation page
      toast({
        title: "Success",
        description: "Loading slip saved successfully!",
        duration: 4000,
      });
    } catch (e: any) {
      console.error("Failed to save loading slip", e);
      setError("Failed to save loading slip");
      return;
    } finally {
      setSaving(false);
    }
    // Stay on page; previews now enabled by savedSlipId
  };

  // Ensure a parent slip exists and capture slip_number from DB for previews
  // Removed implicit persist on preview. Previews are enabled only after a successful save.

  // Map to preview props
  const previewItems = enrichItemsWithProductData(
    rows
      .filter((r) => r.description.trim() !== "")
      .map((r) => ({
        id: r.id,
        description: r.description,
        requiredQty: r.requiredQty || 0,
        qtyInKgPc: r.qtyInKgPc || 0,
        totalQtyKg: r.totalQtyKg || 0,
        unitRate: 0,
        totalValue: 0,
      }))
  );

  const quotationData = {
    to,
    phone,
    date,
    companyName,
  };

  // Preview state and print helpers (similar to new-quotation)
  const [showLoadingSlip, setShowLoadingSlip] = useState(false);
  const [showPOSLoadingSlip, setShowPOSLoadingSlip] = useState(false);

  const printContent = (contentId: string) => {
    const contentToPrint = document.getElementById(contentId);
    if (!contentToPrint) return;
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    const contentClone = contentToPrint.cloneNode(true) as HTMLElement;
    const printStyles = document.createElement('style');
    printStyles.textContent = `
      @page { size: A4; margin: 10mm; }
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin:0 !important; padding:0 !important; background:white !important; }
      .print-content { width:100% !important; max-width:100% !important; margin:0 !important; padding:0 !important; box-shadow:none !important; }
      .no-print { display:none !important; }
    `;
    const style = document.createElement('style');
    style.textContent = `
      body > *:not(#print-container) { display:none !important; }
      #print-container { position:absolute; left:0; top:0; width:100%; height:100%; z-index:9999; }
    `;
    printContainer.appendChild(printStyles);
    printContainer.appendChild(contentClone);
    document.body.appendChild(printContainer);
    const cleanup = () => {
      document.body.removeChild(printContainer);
      document.head.removeChild(style);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    document.head.appendChild(style);
    setTimeout(() => window.print(), 100);
  };

  const resetPreviews = () => { setShowLoadingSlip(false); setShowPOSLoadingSlip(false); };

  if (showLoadingSlip) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white p-4 shadow-md print:hidden">
          <div className="container mx-auto flex justify-between items-center">
            <Button onClick={resetPreviews} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Form
            </Button>
            <div className="space-x-2">
              <Button onClick={() => { setShowLoadingSlip(false); setShowPOSLoadingSlip(true); }} variant="outline" className="border-red-500 text-red-600">
                <Receipt className="h-4 w-4 mr-2" /> POS Preview
              </Button>
              <Button onClick={() => printContent('loading-slip-preview-content')} className="bg-red-600 hover:bg-red-700 text-white">
                <Printer className="h-4 w-4 mr-2" />
                Print Loading Slip
              </Button>
            </div>
          </div>
        </div>
        <div id="loading-slip-preview-content" className="print-content">
          <LoadingSlipPreview
            quotationData={{ to, phone, date, companyName }}
            items={previewItems}
            totals={{ totalWeight: totals.totalWeight }}
            quotationNumber={savedSlipNumber || slipNumber}
          />
        </div>
      </div>
    );
  }

  if (showPOSLoadingSlip) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white p-4 shadow-md print:hidden">
          <div className="container mx-auto flex justify-between items-center">
            <Button onClick={resetPreviews} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Form
            </Button>
            <div className="space-x-2">
              <Button onClick={() => { setShowPOSLoadingSlip(false); setShowLoadingSlip(true); }} variant="outline" className="border-red-500 text-red-600">
                <Truck className="h-4 w-4 mr-2" /> Loading Slip Preview
              </Button>
              <Button onClick={() => printContent('pos-loading-slip-preview-content')} className="bg-red-600 hover:bg-red-700 text-white">
                <Printer className="h-4 w-4 mr-2" />
                Print POS Loading Slip
              </Button>
            </div>
          </div>
        </div>
        <div id="pos-loading-slip-preview-content" className="print-content">
          <POSLoadingSlipPreview
            quotationData={{ to, phone, date, companyName }}
            items={previewItems}
            totals={totals}
            quotationNumber={savedSlipNumber || slipNumber}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <style jsx global>{`
        input.no-spinner::-webkit-outer-spin-button,
        input.no-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input.no-spinner[type=number] {
          -moz-appearance: textfield;
          appearance: textfield;
        }
      `}</style>
      <header className="bg-white text-black shadow-lg border-b-4 border-red-500">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Quick Load Slip</h1>
          <div className="space-x-2">
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => router.push("/landing")}>Back</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="mb-4">
          <div className="flex rounded-md border border-red-500 overflow-hidden w-full">
            <button
              className={`flex-1 px-3 py-2 text-sm sm:text-base ${activeTab === 'create' ? 'bg-red-600 text-white' : 'bg-white text-red-600'}`}
              onClick={() => {
                // Navigating to Create: always reset to a fresh slip
                setActiveTab('create');
                setSavedSlipId(null);
                setSavedSlipNumber(null);
                resetAll();
              }}
            >
              Create New Load Slip
            </button>
            <button
              className={`flex-1 px-3 py-2 text-sm sm:text-base border-l border-red-500 ${activeTab === 'view' ? 'bg-red-600 text-white' : 'bg-white text-red-600'}`}
              onClick={() => {
                // Leaving Create without save? Prompt before switching
                const goingFromCreate = activeTab === 'create';
                const hasItems = rows.some(r => r.description.trim() || r.requiredQty > 0);
                const hasHeader = (to.trim() !== '' || phone.trim() !== '');
                const unsaved = goingFromCreate && !savedSlipId && (hasItems || hasHeader);
                if (unsaved) {
                  const ok = window.confirm('You have unsaved changes. Save before leaving?');
                  if (!ok) return;
                }
                setActiveTab('view');
                // Load slips when entering view
                loadSlips();
              }}
            >
              View Load Slips
            </button>
          </div>
        </div>

        {activeTab === 'view' ? (
          <section className="bg-white rounded-lg p-4 border-2 border-red-500 text-black">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">All Load Slips</h2>
              <Button variant="outline" className="border-red-500 text-red-600" onClick={loadSlips} disabled={slipsLoading}>
                {slipsLoading ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="min-w-[720px] md:min-w-0 w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 sm:px-3 py-1 text-left">Slip Number</th>
                    <th className="border px-2 sm:px-3 py-1 text-left">Customer</th>
                    <th className="border px-2 sm:px-3 py-1 text-left">Created At</th>
                    <th className="border px-2 sm:px-3 py-1 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slips.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-gray-500">No load slips found</td>
                    </tr>
                  ) : (
                    slips.map(s => (
                      <tr key={s.id} className="odd:bg-white even:bg-gray-50">
                        <td className="border px-2 sm:px-3 py-1">{s.slip_number}</td>
                        <td className="border px-2 sm:px-3 py-1">{s.to_name || '—'}</td>
                        <td className="border px-2 sm:px-3 py-1 whitespace-nowrap">{new Date(s.created_at).toLocaleString()}</td>
                        <td className="border px-2 sm:px-3 py-1 text-center space-x-1 sm:space-x-2 whitespace-nowrap">
                          <Button
                            variant="outline"
                            className="border-red-500 text-red-600 p-2"
                            onClick={() => handleViewSlip(s.id)}
                            title="View"
                            aria-label="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            className="border-gray-500 text-black p-2"
                            onClick={() => handleEditSlip(s.id)}
                            title="Edit"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            className="border-gray-400 text-black p-2"
                            onClick={() => handleDeleteSlip(s.id)}
                            title="Delete"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
        <>
        <section className="bg-white rounded-lg p-4 border-2 border-red-500 text-black">
          <h2 className="text-lg font-bold mb-3">Slip Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Delivery To</label>
              <input 
                ref={(el) => headerFieldsRef.current['to'] = el}
                className="w-full border rounded px-2 py-1" 
                value={to} 
                onChange={(e) => setTo(e.target.value)}
                onKeyDown={(e) => handleHeaderKeyDown(e, 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input 
                ref={(el) => headerFieldsRef.current['phone'] = el}
                className="w-full border rounded px-2 py-1" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => handleHeaderKeyDown(e, 1)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input 
                ref={(el) => headerFieldsRef.current['date'] = el}
                type="date" 
                className="w-full border rounded px-2 py-1" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                onKeyDown={(e) => handleHeaderKeyDown(e, 2)}
              />
            </div>
          {/* Slip Number removed from UI per request; still maintained in state for backend save */}
        </div>
      </section>

      <section className="bg-white rounded-lg p-4 border-2 border-red-500 text-black mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Loading Items</h2>
          <div className="text-sm font-semibold">Total Weight: <span className="text-red-600">{totals.totalWeight.toFixed(3)} KG</span></div>
        </div>
        <div className="overflow-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1 text-left">Item Description</th>
                <th className="border px-2 py-1 text-center">Qty in KG/PC</th>
                <th className="border px-2 py-1 text-center">Required Qty (Nos)</th>
                <th className="border px-2 py-1 text-center">Total KG</th>
                <th className="border px-2 py-1 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="odd:bg-white even:bg-gray-50">
                  <td className="border px-2 py-1">
                    <ItemInput
                      options={products.map(p => ({ value: p.id, label: p.item_name, data: p }))}
                      value={row.description}
                      onValueChange={(value: string, data?: any, label?: string) => {
                        setRows(prev => prev.map(r => {
                          if (r.id !== row.id) return r;
                          if (data) {
                            const qtyInKgPc = data?.item_weight || 0;
                            const desc = label ?? data?.item_name ?? value;
                            const totalQtyKg = round3(qtyInKgPc * (r.requiredQty || 0));
                            return { ...r, productId: data.id, description: desc, qtyInKgPc, totalQtyKg };
                          } else {
                            // Free text entry
                            const desc = value || "";
                            // Try exact match by name to auto-fill weight
                            const exact = products.find(p => p.item_name.toLowerCase() === desc.toLowerCase());
                            const qtyInKgPc = exact?.item_weight || 0;
                            const totalQtyKg = round3(qtyInKgPc * (r.requiredQty || 0));
                            const pid = exact?.id || sentinelProductId || null;
                            return { ...r, productId: pid as any, description: desc, qtyInKgPc, totalQtyKg };
                          }
                        }))
                      }}
                      placeholder="Type or select item..."
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <input
                      ref={(el) => itemFieldsRef.current[`${row.id}-qtyInKgPc`] = el}
                      type="number"
                      min={0}
                      step="0.001"
                      className="w-24 border rounded px-2 py-1 text-right no-spinner"
                      value={row.qtyInKgPc === 0 ? "" : row.qtyInKgPc}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        const num = val === "" ? 0 : Number(val);
                        setRows(prev => prev.map(r => {
                          if (r.id !== row.id) return r;
                          const qtyInKgPc = isNaN(num) ? 0 : num;
                          const totalQtyKg = round3(qtyInKgPc * (r.requiredQty || 0));
                          return { ...r, qtyInKgPc, totalQtyKg };
                        }));
                      }}
                      onKeyDown={(e) => handleItemKeyDown(e, rows.findIndex(r => r.id === row.id), 0)}
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <input
                      ref={(el) => itemFieldsRef.current[`${row.id}-requiredQty`] = el}
                      type="number"
                      min={0}
                      className="w-24 border rounded px-2 py-1 text-right no-spinner"
                      value={row.requiredQty === 0 ? "" : row.requiredQty}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        const num = val === "" ? 0 : Number(val);
                        updateRowRequiredQty(row.id, isNaN(num) ? 0 : num);
                      }}
                      onKeyDown={(e) => handleItemKeyDown(e, rows.findIndex(r => r.id === row.id), 1)}
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    {row.totalQtyKg ? row.totalQtyKg.toFixed(3) : "—"}
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <Button
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50 p-2"
                      onClick={() => removeRow(row.id)}
                      title="Remove row"
                      aria-label="Remove row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Optimized action bar */}
        {/* Sticky action bar on mobile */}
        <div className="mt-3 md:mt-3 fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t p-2 sm:p-3 md:static md:bg-transparent md:border-0 md:p-0 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="space-x-2">
            <Button className="w-full md:w-auto bg-red-600 hover:bg-red-700" onClick={addRow}>Add Item</Button>
          </div>
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-gray-400 text-black"
              onClick={() => {
                const hasItems = rows.some(r => r.description.trim() || r.requiredQty > 0);
                const hasHeader = (to.trim() !== '' || phone.trim() !== '');
                if (hasItems || hasHeader) {
                  const ok = window.confirm('Reset all fields? This will clear current inputs.');
                  if (!ok) return;
                }
                setSavedSlipId(null);
                setSavedSlipNumber(null);
                resetAll();
              }}
            >
              Reset
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto border-red-500 text-red-600"
              onClick={() => setShowLoadingSlip(true)}
              disabled={!savedSlipId}
              title={!savedSlipId ? "Save the loading slip first" : undefined}
            >
              <Truck className="h-4 w-4 mr-1" /> Preview Load Slip
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto border-red-500 text-red-600"
              onClick={() => setShowPOSLoadingSlip(true)}
              disabled={!savedSlipId}
              title={!savedSlipId ? "Save the loading slip first" : undefined}
            >
              <Receipt className="h-4 w-4 mr-1" /> Preview POS Load Slip
            </Button>
            <Button
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
              onClick={saveSlip}
              disabled={!hasValidItems || saving}
              title={!hasValidItems ? 'Add at least one item and required qty' : undefined}
            >
              {saving ? 'Saving...' : 'Save Loading Slip'}
            </Button>
          </div>
        </div>
      </section>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </>
        )}

      </main>
    </div>
  );
}

function round3(n: number) {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}
