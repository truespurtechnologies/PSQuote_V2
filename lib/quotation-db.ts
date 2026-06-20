"use client"

import { getQuotationService, initializeQuotationService } from './supabase/quotation-service';
import type { SavedQuotation as QuotationServiceSavedQuotation } from './supabase/quotation-service';
import { supabase } from './supabase/client';
import type { Database } from '@/lib/database.types';
import { log } from '@/lib/logger';

// Re-export the SavedQuotation type for backward compatibility
export type SavedQuotation = QuotationServiceSavedQuotation;

// Track initialization state
let isInitialized = false;

// Initialize with the authenticated Supabase client
export const initializeQuotationDB = async (): Promise<boolean> => {
  if (isInitialized) return true;
  
  try {
    // Ensure Supabase client is initialized with the latest session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      log.warn('No active session found, using local storage only');
      isInitialized = true; // Mark as initialized to prevent repeated attempts
      return false;
    }

    // Initialize the service with the authenticated client
    // Cast to any to handle type differences between generated types
    initializeQuotationService(supabase as any);
    isInitialized = true;
    return true;
  } catch (error) {
    log.error('Failed to initialize QuotationDB', { error });
    isInitialized = false;
    return false;
  }
};

// Re-export types for backward compatibility
export interface QuotationItem {
  id: string;
  description: string;
  requiredQty: number;
  qtyInKgPc: number;
  totalQtyKg: number;
  unitRate: number;
  totalValue: number;
}

export interface QuotationData {
  to: string;
  phone: string;
  date: string;
  companyName: string;
  accountNo: string;
  bankName: string;
  ifscCode: string;
}

/**
 * QuotationDB - A hybrid database service that uses Supabase with localStorage fallback
 */
export interface IQuotationDB {
  deleteQuotation(id: string): Promise<boolean>;
  saveQuotation(quotation: Omit<SavedQuotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedQuotation>;
  getQuotationById(id: string): Promise<SavedQuotation | null>;
  getQuotationByNumber(number: string): Promise<SavedQuotation | null>;
  getAllQuotations(): Promise<Array<Record<string, any>>>;
  generateQuotationNumber(): Promise<string>;
  updateQuotation(quotation: SavedQuotation): Promise<SavedQuotation | null>;
}

export class QuotationDB implements IQuotationDB {
  private static readonly STORAGE_KEY = "popular_steels_quotations";
  private static useSupabase = false; // Default to false until we confirm Supabase is available

  /**
   * Initialize the database service
   * @returns Promise that resolves to true if Supabase is available, false otherwise
   */
  static async initialize(): Promise<boolean> {
    if (isInitialized) {
      return this.useSupabase;
    }

    try {
      // Initialize Supabase client first
      const supabaseInitialized = await initializeQuotationDB();
      if (!supabaseInitialized) {
        console.warn('Supabase initialization failed, falling back to localStorage');
        this.useSupabase = false;
        isInitialized = true;
        return false;
      }

      // Now get the service
      const service = getQuotationService();
      if (!service) {
        throw new Error('Failed to get QuotationService instance');
      }

      // Test the connection
      const connected = await service.testConnection();
      console.log('Supabase connection test result:', connected);
      
      this.useSupabase = connected;
      isInitialized = true;
      return connected;
    } catch (error) {
      console.warn('Failed to initialize Supabase, falling back to localStorage', error);
      this.useSupabase = false;
      isInitialized = true;
      return false;
    }
  }

  /**
   * Generate a new quotation number
   * @returns Promise that resolves to a new quotation number
   */
  static async generateQuotationNumber(): Promise<string> {
    if (this.useSupabase) {
      try {
        // Prefer atomic server-side allocation via RPC
        const { data, error } = await (supabase as any).rpc('allocate_quotation_number', {
          prefix: 'QT-',
          width: 4,
        });
        if (!error && data) {
          return data as string;
        }

        // Fallback to service-based last quotation logic if RPC not available
        const service = getQuotationService();
        if (!service) {
          throw new Error('QuotationService not initialized');
        }
        const lastQuotation = await service.getLastQuotation();
        if (lastQuotation) {
          const lastNumber = parseInt(lastQuotation.quotationNumber.replace('QT-', '')) || 0;
          return `QT-${String(lastNumber + 1).padStart(4, '0')}`;
        }
      } catch (error) {
        console.warn('Failed to generate quotation number from Supabase, falling back to localStorage', error);
        this.useSupabase = false;
      }
    }
    
    // Fallback to localStorage if Supabase fails or not available
    const quotations = await this.getAllQuotations();
    const nextNumber = quotations.length + 1;
    return `QT-${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Save or update a quotation
   * @param quotation The quotation data to save
   * @returns The saved quotation
   */
  static async saveQuotation(quotation: Omit<SavedQuotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedQuotation> {
    // Ensure a quotation number is present; generate if missing
    let ensuredQuotationNumber = quotation.quotationNumber?.toString().trim();
    if (!ensuredQuotationNumber) {
      try {
        ensuredQuotationNumber = await this.generateQuotationNumber();
      } catch (e) {
        console.warn('Failed to generate quotation number, defaulting to QT-0001', e);
        ensuredQuotationNumber = 'QT-0001';
      }
    }

    // Convert dates to ISO strings for consistency
    const dateValue = (() => {
      try {
        if (typeof quotation.date === 'string') return quotation.date;
        if (quotation.date && typeof quotation.date === 'object' && 'toISOString' in (quotation.date as Date)) {
          return (quotation.date as Date).toISOString();
        }
        return new Date().toISOString();
      } catch (e) {
        console.warn('Error formatting date, using current date', e);
        return new Date().toISOString();
      }
    })();
      
    const validUntilValue = (() => {
      if (!quotation.validUntil) return undefined;
      try {
        if (typeof quotation.validUntil === 'string') return quotation.validUntil;
        if (quotation.validUntil && typeof quotation.validUntil === 'object' && 'toISOString' in (quotation.validUntil as Date)) {
          return (quotation.validUntil as Date).toISOString();
        }
        return undefined;
      } catch (e) {
        console.warn('Error formatting validUntil date', e);
        return undefined;
      }
    })();
      
    const newQuotation: SavedQuotation = {
      ...quotation,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      date: dateValue,
      validUntil: validUntilValue,
      quotationNumber: ensuredQuotationNumber,
      customerId: quotation.customerId || '',
      status: quotation.status || 'draft',
      termsConditions: quotation.termsConditions || [],
      subtotal: quotation.subtotal || 0,
      discountAmount: quotation.discountAmount || 0,
      taxAmount: quotation.taxAmount || 0,
      totalAmount: quotation.totalAmount || 0,
      userId: quotation.userId || '',
      items: quotation.items || [],
      charges: quotation.charges || {},
      totals: quotation.totals || {}
    };

    if (this.useSupabase) {
      try {
        const service = getQuotationService();
        if (!service) {
          throw new Error('QuotationService not initialized');
        }
        const result = await service.saveQuotation(newQuotation);
        return result;
      } catch (error) {
        console.warn('Failed to save quotation to Supabase, falling back to localStorage', error);
        this.useSupabase = false;
      }
    }

    // Fallback to localStorage
    this.saveToLocalStorage(newQuotation);
    return newQuotation;
  }

  /**
   * Convert a SavedQuotation to a format suitable for localStorage
   * @param quotation The quotation to convert
   * @returns The converted quotation with dates as strings
   */
  private static toLocalQuotation(quotation: SavedQuotation): Record<string, unknown> {
    const { id, createdAt, updatedAt, items, charges, totals, ...rest } = quotation;
    const result: Record<string, unknown> = {
      ...rest,
      id,
      createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
      updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt,
      date: rest.date,
      validUntil: rest.validUntil,
    };
    
    if (items) {
      result.items = [...items];
    }
    
    if (charges) {
      result.charges = { ...charges };
    }
    
    if (totals) {
      result.totals = { ...totals };
    }

    return result;
  }

  /**
   * Convert from localStorage format to SavedQuotation
   * @param data The data from localStorage
   * @returns A SavedQuotation object with proper Date objects
   */
  private static fromLocalQuotation(data: Record<string, unknown>): SavedQuotation {
    // Ensure date and validUntil are properly typed
    const dateValue = data.date ? 
      (typeof data.date === 'string' ? data.date : new Date().toISOString()) : 
      new Date().toISOString();
      
    const validUntilValue = data.validUntil ? 
      (typeof data.validUntil === 'string' ? data.validUntil : undefined) : 
      undefined;

    const result: SavedQuotation = {
      id: typeof data.id === 'string' ? data.id : '',
      quotationNumber: typeof data.quotationNumber === 'string' ? data.quotationNumber : '',
      customerId: typeof data.customerId === 'string' ? data.customerId : '',
      date: dateValue,
      validUntil: validUntilValue,
      status: typeof data.status === 'string' ? data.status : 'draft',
      notes: typeof data.notes === 'string' ? data.notes : '',
      termsConditions: Array.isArray(data.termsConditions) ? [...data.termsConditions] : [],
      subtotal: typeof data.subtotal === 'number' ? data.subtotal : 0,
      discountAmount: typeof data.discountAmount === 'number' ? data.discountAmount : 0,
      taxAmount: typeof data.taxAmount === 'number' ? data.taxAmount : 0,
      totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : 0,
      userId: typeof data.userId === 'string' ? data.userId : '',
      createdAt: data.createdAt ? new Date(data.createdAt as string) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt as string) : new Date(),
      items: Array.isArray(data.items) ? [...data.items as QuotationItem[]] : [],
      charges: data.charges && typeof data.charges === 'object' ? { ...data.charges as object } : {},
      totals: data.totals && typeof data.totals === 'object' ? { ...data.totals as object } : {},
      quotationData: data.quotationData
    };

    return result;
  }

  /**
   * Get all quotations from localStorage
   * @returns Array of SavedQuotation objects
   */
  private static getAllLocalQuotations(): SavedQuotation[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        console.warn('Stored quotations is not an array, resetting...');
        return [];
      }
      
      return parsed.map((q: unknown) => this.fromLocalQuotation(q as Record<string, unknown>));
    } catch (error) {
      console.error('Error loading quotations from localStorage:', error);
      return [];
    }
  }

  /**
   * Save a quotation to localStorage
   * @param quotation The quotation to save
   */
  private static saveToLocalStorage(quotation: SavedQuotation): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const quotations = this.getAllLocalQuotations();
      const index = quotations.findIndex((q: SavedQuotation) => q.id === quotation.id);
      
      if (index >= 0) {
        quotations[index] = quotation;
      } else {
        quotations.push(quotation);
      }
      
      localStorage.setItem(
        this.STORAGE_KEY, 
        JSON.stringify(quotations.map((q: SavedQuotation) => this.toLocalQuotation(q)))
      );
    } catch (error) {
      console.error('Error saving quotation to localStorage:', error);
    }
  }



  /**
   * Get a quotation by its quotation number
   * @param number The quotation number to search for
   * @returns The quotation if found, or null if not found
   */
  static async getQuotationByNumber(number: string): Promise<SavedQuotation | null> {
    if (!number) {
      console.error('Cannot get quotation: No quotation number provided');
      return null;
    }

    // Clean and validate the quotation number
    const cleanNumber = number.toString().trim();
    if (!cleanNumber) {
      console.error('Cannot get quotation: Invalid quotation number format');
      return null;
    }

    console.log(`[getQuotationByNumber] Looking up quotation with number: ${cleanNumber}`);

    // First try to get from Supabase if enabled
    if (this.useSupabase) {
      try {
        // Query the quotations table with exact match first
        console.log(`[getQuotationByNumber] Querying Supabase for exact match on: ${cleanNumber}`);
        
        // First try exact match
        const { data: exactMatchData, error: exactMatchError } = await supabase
          .from('quotations')
          .select(`
            *,
            quotation_items (
              *,
              products (*)
            )
          `)
          .eq('quotation_number', cleanNumber)
          .maybeSingle();
          
        if (exactMatchError) {
          console.error('[getQuotationByNumber] Error in exact match query:', exactMatchError);
          throw exactMatchError;
        }

        let quotationData = exactMatchData;
        
        // If no exact match, try case-insensitive search
        if (!quotationData) {
          console.warn('[getQuotationByNumber] No exact match, trying case-insensitive search');
          const { data: caseInsensitiveData, error: caseInsensitiveError } = await supabase
            .from('quotations')
            .select(`
              *,
              quotation_items (
                *,
                products (*)
              )
            `)
            .ilike('quotation_number', `%${cleanNumber}%`)
            .maybeSingle();
            
          if (caseInsensitiveError) {
            console.error('[getQuotationByNumber] Error in case-insensitive query:', caseInsensitiveError);
            throw caseInsensitiveError;
          }
          
          if (!caseInsensitiveData) {
            console.warn('[getQuotationByNumber] No quotation found with any search method');
            return null;
          }
          
          console.log('[getQuotationByNumber] Found with case-insensitive search');
          quotationData = caseInsensitiveData;
        }
        
        console.log(`[getQuotationByNumber] Found quotation:`, { 
          id: quotationData.id, 
          number: quotationData.quotation_number,
          customer: quotationData.customer_name,
          items: quotationData.quotation_items?.length || 0 
        });
        
        // Map the database fields to the SavedQuotation type
        const quotation: SavedQuotation = {
          // Use the ID from the database to maintain referential integrity
          id: quotationData.id,
          quotationNumber: quotationData.quotation_number,
          customerId: quotationData.customer_id || '',
          date: quotationData.date || new Date().toISOString(),
          validUntil: (quotationData as any).valid_until as string | undefined,
          status: quotationData.status || 'draft',
          notes: quotationData.notes || '',
          termsConditions: Array.isArray(quotationData.terms_conditions) ? quotationData.terms_conditions : [],
          subtotal: quotationData.subtotal || 0,
          discountAmount: 0,
          taxAmount: quotationData.gst_amount || 0,
          totalAmount: quotationData.grand_total || 0,
          userId: quotationData.created_by || '',
          createdAt: new Date(quotationData.created_at),
          updatedAt: new Date(quotationData.updated_at || quotationData.created_at),
          quotationData: {
            to: quotationData.customer_name || 'Customer',
            phone: quotationData.customer_phone || '',
            date: quotationData.date || new Date().toISOString(),
            companyName: quotationData.company_name || 'Popular Steels',
            accountNo: quotationData.account_no || '1234567890',
            bankName: quotationData.bank_name || 'State Bank of India',
            ifscCode: quotationData.ifsc_code || 'SBIN0001234',
            // Client details for backward compatibility
            clientDetails: {
              name: quotationData.customer_name || 'Customer',
              id: quotationData.customer_id || ''
            }
          },
          // Map quotation items to the expected format
          items: quotationData.quotation_items?.map((item: any) => ({
            id: item.id,
            description: item.description || '',
            requiredQty: item.qty || 0,
            qtyInKgPc: item.qty_in_kg_pc || 0,
            totalQtyKg: item.total_qty_kg || 0,
            unitRate: item.unit_rate || 0,
            totalValue: item.total_value || 0,
            productId: item.product_id || '',
            product: item.products ? {
              id: item.products.id,
              name: item.products.item_name || '',
              code: item.products.item_code || '',
              rate: item.products.item_rate || 0,
              unit: item.products.item_unit || 'pc',
              gstRate: item.products.gst_rate || 0,
              hsnCode: item.products.hsn_code || '',
              category: item.products.item_category || '',
              subCategory: item.products.item_sub_category || '',
              type: item.products.item_type || '',
              size: item.products.item_size || '',
              weight: item.products.item_weight || 0
            } : undefined
          })) || [],
          // Map charges
          charges: {
            loading: quotationData.loading_charges || 0,
            gst: quotationData.gst_amount || 0,
            roundOff: quotationData.round_off || 0
          },
          // Map totals
          totals: {
            subtotal: quotationData.subtotal || 0,
            tax: quotationData.gst_amount || 0,
            total: quotationData.grand_total || 0,
            accountNo: quotationData.account_no || '',
            ifscCode: quotationData.ifsc_code || '',
            gstRate: quotationData.gst_rate || 0
          }
        };
        
        return quotation;
      } catch (error: any) {
        console.error('Failed to get quotation by number from Supabase:', error);
        if (error?.code) {
          console.error(`Supabase error code: ${error.code}`);
          if (error.code === 'PGRST301') {
            console.error('Invalid query parameters - please check the quotation number format');
          } else if (error.code === '42501') {
            console.error('Permission denied - check RLS policies on the quotations table');
          }
        }
        this.useSupabase = false;
      }
    }

    // Fallback to localStorage
    const quotations = this.getAllLocalQuotations();
    const found = quotations.find(q => 
      q.quotationNumber === number
    );
    return found ? { ...found } : null;
  }

  /**
   * Get a quotation by ID (UUID) or quotation number
   * @param id The quotation ID (UUID) or quotation number to retrieve
   * @returns The quotation if found, or null if not found
   */
  static async getQuotationById(id: string): Promise<SavedQuotation | null> {
    if (!id) {
      console.error('Cannot get quotation: No ID provided');
      return null;
    }

    if (this.useSupabase) {
      try {
        console.log('Looking up quotation with ID/Number:', id);
        
        // First, get the quotation by ID or number to get the UUID
        const { data: quotationData, error: quotationError } = await supabase
          .from('quotations')
          .select('*')
          .or(`and(id.eq.${id}),and(quotation_number.eq.${id})`)
          .single();
          
        if (quotationError || !quotationData) {
          console.error('Error fetching quotation from Supabase:', quotationError);
          return null;
        }

        // Then, fetch the related quotation_items using the quotation's ID
        const { data: quotationItems, error: itemsError } = await supabase
          .from('quotation_items')
          .select('*, products(*)')
          .eq('quotation_id', quotationData.id);
          
        if (itemsError) {
          console.error('Error fetching quotation items from Supabase:', itemsError);
          // Continue with empty items array if we can't fetch items
        }
          
        if (quotationData) {
          // Map the database fields to the SavedQuotation type
          const quotation: SavedQuotation = {
            // Use the ID from the database to maintain referential integrity
            id: quotationData.id,
            quotationNumber: quotationData.quotation_number,
            customerId: quotationData.customer_id || '',
            date: quotationData.date || new Date().toISOString(),
            validUntil: (quotationData as any).valid_until as string | undefined,
            status: quotationData.status || 'draft',
            notes: quotationData.notes || '',
            termsConditions: Array.isArray(quotationData.terms_conditions) ? quotationData.terms_conditions : [],
            subtotal: quotationData.subtotal || 0,
            discountAmount: 0,
            taxAmount: quotationData.gst_amount || 0,
            totalAmount: quotationData.grand_total || 0,
            userId: quotationData.created_by || '',
            createdAt: new Date(quotationData.created_at),
            updatedAt: new Date(quotationData.updated_at || quotationData.created_at),
            // For backward compatibility with existing code
            quotationData: {
              to: quotationData.customer_name || 'Customer',
              phone: quotationData.customer_phone || '',
              date: quotationData.date || new Date().toISOString(),
              companyName: quotationData.company_name || 'Popular Steels',
              accountNo: quotationData.account_no || '1234567890',
              bankName: quotationData.bank_name || 'State Bank of India',
              ifscCode: quotationData.ifsc_code || 'SBIN0001234',
              // Client details for backward compatibility
              clientDetails: {
                name: quotationData.customer_name || 'Customer',
                id: quotationData.customer_id || ''
              }
            },
            // Map quotation items to the expected format
            items: (quotationItems || []).map((item: any) => ({
              id: item.id,
              description: item.description || '',
              requiredQty: item.qty || 0,
              qtyInKgPc: item.qty_in_kg_pc || 0,
              totalQtyKg: item.total_qty_kg || 0,
              unitRate: item.unit_rate || 0,
              totalValue: item.total_value || 0,
              productId: item.product_id || '',
              product: item.products ? {
                id: item.products.id,
                name: item.products.item_name || '',
                code: item.products.item_code || '',
                rate: item.products.item_rate || 0,
                unit: item.products.item_unit || 'pc',
                gstRate: item.products.gst_rate || 0,
                hsnCode: item.products.hsn_code || '',
                category: item.products.item_category || '',
                subCategory: item.products.item_sub_category || '',
                type: item.products.item_type || '',
                size: item.products.item_size || '',
                weight: item.products.item_weight || 0
              } : undefined
            })),
            // Map charges with GST rate and round off from database
            charges: {
              loading: quotationData.loading_charges || 0,
              gst: quotationData.gst_amount || 0,
              gstRate: quotationData.gst_rate || 18, // Default to 18% if not specified
              roundOff: quotationData.round_off || 0,
              grandTotal: quotationData.grand_total || 0
            },
            // Map totals with proper GST rate and round off
            totals: {
              subtotal: quotationData.subtotal || 0,
              tax: quotationData.gst_amount || 0,
              total: quotationData.grand_total || 0,
              accountNo: quotationData.account_no || '',
              ifscCode: quotationData.ifsc_code || '',
              gstRate: quotationData.gst_rate || 18, // Default to 18% if not specified
              roundOff: quotationData.round_off || 0
            }
          };
          
          return quotation;
        }
      } catch (error) {
        console.warn('Failed to get quotation from Supabase, falling back to localStorage', error);
        this.useSupabase = false;
      }
    }

    // Fallback to localStorage
    const quotations = this.getAllLocalQuotations();
    const found = quotations.find(q => q.id === id);
    return found ? { ...found } : null;
  }

  static async getQuotationsPage(page: number, pageSize: number): Promise<{ data: Array<Record<string, any>>; total: number }> {
    try {
      // Ensure we're initialized
      if (!isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.warn('Using localStorage fallback for quotations (pagination)');
          const localQuotations = this.getAllLocalQuotations();
          const mapped = localQuotations.map(this.mapLocalQuotation);

          const total = mapped.length;
          const from = Math.max(0, (page - 1) * pageSize);
          const to = Math.min(total, from + pageSize);

          return {
            data: mapped.slice(from, to),
            total,
          };
        }
      }

      // If we get here, we're initialized and should use Supabase when available
      if (this.useSupabase) {
        try {
          const from = (page - 1) * pageSize;
          const to = from + pageSize - 1;

          const { data: quotations, error: quotationsError, count } = await supabase
            .from('quotations')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

          if (quotationsError) {
            console.error('Error fetching paginated quotations:', quotationsError);
            throw quotationsError;
          }

          const total = typeof count === 'number' ? count : (quotations?.length || 0);

          if (!quotations || quotations.length === 0) {
            return {
              data: [],
              total,
            };
          }

          const formattedData = (quotations || []).map((quotation: any) => {
            const quotationData = typeof quotation.quotation_data === 'object' && quotation.quotation_data !== null
              ? quotation.quotation_data
              : {};

            return {
              ...quotation,
              // Do not preload items here; they are fetched per-quotation when needed (e.g. in preview)
              items: [],
              quotation_data: {
                ...quotationData,
                clientDetails: {
                  name: quotation.customer_name,
                  ...(quotationData.clientDetails || {}),
                },
              },
            };
          });

          console.log('Fetched paginated quotations from Supabase:', { page, pageSize, total });

          return {
            data: formattedData,
            total,
          };
        } catch (error) {
          console.error('Error in Supabase paginated query:', error);
          this.useSupabase = false;
          // Fall through to local storage on error
        }
      }

      // Fallback to local storage if Supabase is not available or fails
      const localQuotations = this.getAllLocalQuotations();
      const mapped = localQuotations.map(this.mapLocalQuotation);
      const total = mapped.length;
      const from = Math.max(0, (page - 1) * pageSize);
      const to = Math.min(total, from + pageSize);

      return {
        data: mapped.slice(from, to),
        total,
      };
    } catch (error) {
      console.error('Error in getQuotationsPage:', error);
      this.useSupabase = false;
      return {
        data: [],
        total: 0,
      };
    }
  }

  /**
   * Get all quotations
   * @param userId Optional user ID to filter quotations by user
   * @returns Array of all quotations in DatabaseQuotation format
   */
  static async getAllQuotations(): Promise<Array<Record<string, any>>> {
    try {
      // Ensure we're initialized
      if (!isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.warn('Using localStorage fallback for quotations');
          const localQuotations = this.getAllLocalQuotations();
          return localQuotations.map(this.mapLocalQuotation);
        }
      }
      
      // If we get here, we're initialized and should use Supabase
      const service = getQuotationService();
      if (!service) {
        throw new Error('Quotation service not available');
      }
      
      if (this.useSupabase) {
        try {
          // First, get all quotations (without preloading items to avoid huge IN() filters)
          const { data: quotations, error: quotationsError } = await supabase
            .from('quotations')
            .select('*')
            .order('created_at', { ascending: false });

          if (quotationsError) {
            console.error('Error fetching quotations:', quotationsError);
            throw quotationsError;
          }

          if (!quotations || quotations.length === 0) {
            return [];
          }

          // Transform the data to match the expected format used by the UI
          const formattedData = (quotations || []).map((quotation: any) => {
            const quotationData = typeof quotation.quotation_data === 'object' && quotation.quotation_data !== null
              ? quotation.quotation_data
              : {};

            return {
              ...quotation,
              // Do not preload items here; they are fetched per-quotation when needed (e.g. in preview)
              items: [],
              quotation_data: {
                ...quotationData,
                clientDetails: {
                  name: quotation.customer_name,
                  ...(quotationData.clientDetails || {})
                }
              }
            };
          });

          console.log('Fetched all quotations from Supabase:', formattedData);
          return formattedData;
        } catch (error) {
          console.error('Error in Supabase query:', error);
          this.useSupabase = false;
          // Fall through to local storage on error
        }
      }
      
      // If we get here, either useSupabase is false or there was an error with Supabase
      // Fall back to local storage
      const localQuotations = this.getAllLocalQuotations();
      return localQuotations.map(this.mapLocalQuotation);
    } catch (error) {
      console.error('Error in getAllQuotations:', error);
      this.useSupabase = false;
      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Maps a local quotation to the database format
   * @private
   */
  private static mapLocalQuotation(q: SavedQuotation): Record<string, any> {
    return {
      id: q.id,
      quotation_number: q.quotationNumber,
      customer_id: q.customerId,
      customer_name: q.quotationData?.clientDetails?.name || 'Unknown Client',
      created_at: q.createdAt,
      updated_at: q.updatedAt,
      grand_total: q.totalAmount || 0,
      subtotal: q.subtotal || 0,
      discount_amount: q.discountAmount,
      tax_amount: q.taxAmount,
      status: q.status,
      notes: q.notes,
      terms_conditions: q.termsConditions,
      valid_until: q.validUntil,
      user_id: q.userId,
      created_by: q.userId,
      items: q.items || [],
      charges: q.charges || {},
      totals: q.totals || {},
      quotation_data: q.quotationData || {}
    };
  }

  /**
   * Get the most recent quotation
   * @returns The most recent quotation, or null if none found
   */
  static async getLastQuotation(): Promise<SavedQuotation | null> {
    try {
      // Ensure we're initialized
      if (!isInitialized) {
        await this.initialize();
      }

      // Try Supabase first if available
      if (this.useSupabase) {
        const service = getQuotationService();
        if (!service) {
          throw new Error('Quotation service not available');
        }

        const { data, error } = await supabase
          .from('quotations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          return data as unknown as SavedQuotation;
        }
        
        if (error) {
          console.warn('Error getting last quotation from Supabase:', error);
          this.useSupabase = false;
        }
      }

      // Fall back to localStorage
      const quotations = this.getAllLocalQuotations();
      if (quotations.length === 0) {
        return null;
      }
      
      // Sort by creation date (newest first) and return the first one
      const sorted = [...quotations].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      return { ...sorted[0] };
    } catch (error) {
      console.error('Error in getLastQuotation:', error);
      return null;
    }
  }

  /**
   * Update a quotation's status
    }

    if (!id) {
      console.error('Cannot delete quotation: No ID provided');
      return false;
    }

    try {
      // Try Supabase first if available
      if (QuotationDB.useSupabase) {
        const { error } = await supabase
          .from('quotations')
          .delete()
          .eq('id', id);

        if (!error) {
          // Also delete from localStorage to keep in sync
          const localQuotations = QuotationDB.getAllLocalQuotations();
          const updatedQuotations = localQuotations.filter(q => q.id !== id);
          localStorage.setItem(QuotationDB.STORAGE_KEY, JSON.stringify(updatedQuotations));
          return true;
        } else {
          console.error('Error deleting from Supabase:', error);
          QuotationDB.useSupabase = false; // Fall back to localStorage on error
        }
      }
      
      // Fall back to localStorage if Supabase is not available or failed
      const quotations = QuotationDB.getAllLocalQuotations();
      const filtered = quotations.filter(q => q.id !== id);
      
      if (quotations.length === filtered.length) {
        console.warn(`Quotation with ID ${id} not found`);
        return false;
      }
      
      localStorage.setItem(QuotationDB.STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting quotation:', error);
      return false;
    }
  }
  
  /**
   * Delete a quotation by ID
   * @param id The ID of the quotation to delete
   * @returns true if the quotation was deleted, false otherwise
   */
  static async deleteQuotation(id: string): Promise<boolean> {
    if (!id) {
      console.error('Cannot delete quotation: No ID provided');
      return false;
    }

    try {
      // Ensure we're initialized
      if (!isInitialized) {
        await this.initialize();
      }

      // Try Supabase first if available
      if (this.useSupabase) {
        try {
          const service = getQuotationService();
          if (!service) throw new Error('Quotation service not available');
          await service.deleteQuotation(id);
          return true;
          // Fall through to localStorage if Supabase delete fails
        } catch (error) {
          console.error('Failed to delete quotation from Supabase, falling back to localStorage', error);
          this.useSupabase = false;
          // Fall through to localStorage
        }
      }

      // Fall back to localStorage
      const quotations = this.getAllLocalQuotations();
      const initialLength = quotations.length;
      const updatedQuotations = quotations.filter(q => q.id !== id);
      
      if (updatedQuotations.length < initialLength) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedQuotations));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error in deleteQuotation:', error);
      return false;
    }
  }

  // Instance methods that call the static methods
  async deleteQuotation(id: string): Promise<boolean> {
    return QuotationDB.deleteQuotation(id);
  }

  async saveQuotation(quotation: Omit<SavedQuotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedQuotation> {
    return QuotationDB.saveQuotation(quotation);
  }

  async getQuotationById(id: string): Promise<SavedQuotation | null> {
    return QuotationDB.getQuotationById(id);
  }

  async getQuotationByNumber(number: string): Promise<SavedQuotation | null> {
    return QuotationDB.getQuotationByNumber(number);
  }

  async getAllQuotations(): Promise<Array<Record<string, any>>> {
    return QuotationDB.getAllQuotations();
  }

  async generateQuotationNumber(): Promise<string> {
    return QuotationDB.generateQuotationNumber();
  }

  async updateQuotation(quotation: SavedQuotation): Promise<SavedQuotation | null> {
    return QuotationDB.updateQuotation(quotation);
  }

  /**
   * Update a quotation's status
   * @param id The ID of the quotation to update
   * @param status The new status
   * @returns The updated quotation, or null if the update failed
   */
  static async updateQuotationStatus(id: string, status: string): Promise<SavedQuotation | null> {
    if (!id) {
      console.error('Cannot update quotation status: No ID provided');
      return null;
    }

    try {
      // Ensure we're initialized
      if (!isInitialized) {
        await this.initialize();
      }

      const quotation = await this.getQuotationById(id);
      if (!quotation) {
        console.warn(`Quotation with ID ${id} not found`);
        return null;
      }

      // Update the status and save
      return await this.updateQuotation({
        ...quotation,
        status,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error in updateQuotationStatus:', error);
      return null;
    }
  }

  /**
   * Update a quotation's status (instance method)
   * @param id The ID of the quotation to update
   * @param status The new status
   * @returns The updated quotation, or null if the update failed
   */
  async updateQuotationStatus(id: string, status: string): Promise<SavedQuotation | null> {
    return QuotationDB.updateQuotationStatus(id, status);
  }

  /**
   * Update an existing quotation
   * @param quotation The quotation data to update
   * @returns The updated quotation, or null if the update failed
   */
  static async updateQuotation(quotation: SavedQuotation): Promise<SavedQuotation | null> {
    // Early return if quotation is invalid
    if (!quotation || !quotation.id) {
      console.error('Cannot update quotation: Invalid or missing ID');
      return null;
    }

    try {
      // Ensure we're initialized
      if (!isInitialized) {
        await this.initialize();
      }

      // Ensure required fields are present
      const updatedQuotation: SavedQuotation = {
        ...quotation,
        updatedAt: new Date(),
        // Ensure all required fields have values
        quotationNumber: quotation.quotationNumber || '',
        customerId: quotation.customerId || '',
        status: quotation.status || 'draft',
        termsConditions: Array.isArray(quotation.termsConditions) ? [...quotation.termsConditions] : [],
        subtotal: typeof quotation.subtotal === 'number' ? quotation.subtotal : 0,
        discountAmount: typeof quotation.discountAmount === 'number' ? quotation.discountAmount : 0,
        taxAmount: typeof quotation.taxAmount === 'number' ? quotation.taxAmount : 0,
        totalAmount: typeof quotation.totalAmount === 'number' ? quotation.totalAmount : 0,
        userId: quotation.userId || '',
        items: Array.isArray(quotation.items) ? [...quotation.items] : [],
        charges: quotation.charges ? { ...quotation.charges } : {},
        totals: quotation.totals ? { ...quotation.totals } : {}
      };

      if (this.useSupabase) {
        try {
          const service = getQuotationService();
          if (!service) throw new Error('Quotation service not available');
          const result = await service.updateQuotation(updatedQuotation);
          if (result) {
            return result;
          }
          // Fall through to localStorage if Supabase update returns null
        } catch (error) {
          console.error('Failed to update quotation in Supabase, falling back to localStorage', error);
          this.useSupabase = false;
          // Fall through to localStorage
        }
      }
      
      // Use localStorage as fallback
      this.saveToLocalStorage(updatedQuotation);
      return { ...updatedQuotation };
    } catch (error) {
      console.error('Error in updateQuotation:', error);
      return null;
    }
  }

}
