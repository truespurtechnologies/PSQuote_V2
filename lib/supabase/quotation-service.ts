import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

// Define the QuotationItem interface
export interface QuotationItem {
  id: string;
  description: string;
  requiredQty: number;
  qtyInKgPc: number;
  totalQtyKg: number;
  unitRate: number;
  totalValue: number;
}

// Define the main Quotation interface
export interface SavedQuotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  date: string;
  validUntil?: string;
  status: string;
  notes?: string;
  termsConditions: string[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  // For backward compatibility with existing code
  quotationData?: any;
  items?: QuotationItem[];
  charges?: any;
  totals?: any;
}

export class QuotationService {
  private supabase: SupabaseClient<Database>;
  private static instance: QuotationService;
  private readonly TABLE_NAME = 'quotations';

  private constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  // Singleton pattern
  public static getInstance(supabase?: SupabaseClient<Database>): QuotationService {
    if (!QuotationService.instance && supabase) {
      QuotationService.instance = new QuotationService(supabase);
    } else if (!QuotationService.instance) {
      throw new Error('QuotationService must be initialized with a Supabase client first');
    }
    return QuotationService.instance;
  }

  private toSavedQuotation(row: Database['public']['Tables']['quotations']['Row']): SavedQuotation {
    return {
      id: row.id,
      quotationNumber: row.quotation_number,
      customerId: row.customer_id || '',
      date: row.date,
      // No valid_until in the database schema, using date as fallback
      validUntil: row.date,
      status: row.status || 'draft',
      // notes field doesn't exist in database schema, using empty string
      termsConditions: row.terms_conditions || [],
      subtotal: row.subtotal,
      // No discount_amount in the database schema, using 0 as default
      discountAmount: 0,
      // Using gst_amount instead of tax_amount
      taxAmount: row.gst_amount || 0,
      // Using grand_total instead of total_amount
      totalAmount: row.grand_total,
      userId: row.created_by || '',
      // Backward compatibility
      quotationData: {
        to: row.customer_name || 'Customer',
        phone: row.customer_phone || '',
        date: row.date,
        companyName: row.company_name || 'Popular Steels',
        accountNo: row.account_no || '',
        bankName: row.bank_name || '',
        ifscCode: row.ifsc_code || ''
      },
      items: [], // Will be populated separately if needed
      charges: {
        loading: row.loading_charges || 0,
        gstRate: row.gst_rate || 0,
        roundOff: row.round_off || 0
      },
      totals: {
        subtotal: row.subtotal,
        // No discount in the database schema, using 0 as default
        discount: 0,
        // Using gst_amount instead of tax_amount
        tax: row.gst_amount || 0,
        // Using grand_total instead of total_amount
        total: row.grand_total
      },
      createdAt: new Date(row.created_at || ''),
      updatedAt: new Date(row.updated_at || '')
    };
  }

  private toDbRow(quotation: Omit<SavedQuotation, 'id' | 'createdAt' | 'updatedAt'>): Database['public']['Tables']['quotations']['Insert'] {
    return {
      quotation_number: quotation.quotationNumber,
      customer_id: quotation.customerId || null,
      customer_name: quotation.quotationData?.to || 'Customer',
      customer_phone: quotation.quotationData?.phone || null,
      date: quotation.date,
      // No valid_until in the database schema, using date as fallback
      status: quotation.status || 'draft',
            terms_conditions: quotation.termsConditions || [],
      subtotal: quotation.subtotal,
      // Using gst_amount instead of tax_amount
      gst_amount: quotation.taxAmount || 0,
      gst_rate: quotation.charges?.gstRate || 0,
      // Using grand_total instead of total_amount
      grand_total: quotation.totalAmount,
      loading_charges: quotation.charges?.loading || 0,
      round_off: quotation.charges?.roundOff || 0,
      company_name: quotation.quotationData?.companyName || 'Popular Steels',
      account_no: quotation.quotationData?.accountNo || null,
      bank_name: quotation.quotationData?.bankName || null,
      ifsc_code: quotation.quotationData?.ifscCode || null,
      created_by: quotation.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Generate the next available quotation number based on the last saved row.
  // Format assumed: "QT-XXXX" where XXXX is a zero-padded integer.
  private async generateNextQuotationNumber(): Promise<string> {
    const last = await this.getLastQuotation();
    if (!last?.quotationNumber) {
      return 'QT-0001';
    }
    const match = /^(\D*)(\d+)$/.exec(last.quotationNumber.replace(/^\s+|\s+$/g, ''));
    if (!match) {
      // Fallback if pattern unexpected
      return 'QT-0001';
    }
    const prefix = match[1] || 'QT-';
    const num = parseInt(match[2], 10) || 0;
    const next = num + 1;
    const width = match[2].length;
    return `${prefix}${String(next).padStart(width, '0')}`;
  }

  // Prefer server-side atomic allocation via RPC when available
  private async allocateQuotationNumberRPC(): Promise<string | null> {
    try {
      // Cast to any because generated Database types may not include the function signature
      const { data, error } = await (this.supabase as any).rpc('allocate_quotation_number', {
        prefix: 'QT-',
        width: 4,
      });
      if (error) return null;
      return (data as string) ?? null;
    } catch {
      return null;
    }
  }

  async saveQuotation(quotation: Omit<SavedQuotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedQuotation> {
    // We may need to retry on unique constraint violation for quotation_number
    let attempt = 0;
    let currentQuotation = { ...quotation };

    // Ensure we have a quotation number first using RPC; fallback to local next-number logic
    if (!currentQuotation.quotationNumber || currentQuotation.quotationNumber.trim().length === 0) {
      const rpcNumber = await this.allocateQuotationNumberRPC();
      if (rpcNumber) {
        currentQuotation.quotationNumber = rpcNumber;
      } else {
        // Fallback; this is non-atomic but our retry will catch collisions
        currentQuotation.quotationNumber = await this.generateNextQuotationNumber();
      }
    }

    while (attempt < 3) {
      const dbRow = this.toDbRow(currentQuotation);
      const { data, error } = await this.supabase
        .from(this.TABLE_NAME)
        .insert(dbRow)
        .select()
        .single();

      if (!error && data) {
        return this.toSavedQuotation(data);
      }

      // If unique violation on quotation_number, regenerate and retry
      // Postgres error code for unique_violation is 23505
      const code = (error as any)?.code;
      const message = (error as any)?.message || '';
      const isDup = code === '23505' || /duplicate key value/i.test(message);
      if (isDup) {
        console.warn('Duplicate quotation_number detected. Regenerating and retrying...', { attempt: attempt + 1 });
        // Try RPC again to avoid further collisions; fallback to local generation
        const rpcNumber = await this.allocateQuotationNumberRPC();
        const nextNumber = rpcNumber ?? (await this.generateNextQuotationNumber());
        currentQuotation = { ...currentQuotation, quotationNumber: nextNumber };
        attempt += 1;
        continue;
      }

      console.error('Error creating quotation:', error);
      throw new Error(`Failed to create quotation: ${message}`);
    }

    // If we exhausted retries
    throw new Error('Failed to create quotation after multiple attempts due to quotation_number conflicts.');
  }

  async updateQuotation(quotation: SavedQuotation): Promise<SavedQuotation> {
    const { id, ...updateData } = quotation;
    const dbRow = this.toDbRow(updateData as any);
    delete (dbRow as any).created_by;

    const { data, error } = await this.supabase
      .from(this.TABLE_NAME)
      .update({
        ...dbRow,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating quotation:', error);
      throw new Error(`Failed to update quotation: ${error.message}`);
    }

    return this.toSavedQuotation(data);
  }

  async deleteQuotation(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting quotation:', error);
      throw new Error(`Failed to delete quotation: ${error.message}`);
    }
  }

  async getQuotationById(id: string): Promise<SavedQuotation | null> {
    const { data, error } = await this.supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null;
      }
      console.error('Error fetching quotation:', error);
      throw new Error(`Failed to fetch quotation: ${error.message}`);
    }

    return this.toSavedQuotation(data);
  }

  async getAllQuotations(userId: string): Promise<SavedQuotation[]> {
    const { data, error } = await this.supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotations:', error);
      throw new Error(`Failed to fetch quotations: ${error.message}`);
    }

    return data.map(row => this.toSavedQuotation(row));
  }

  async testConnection(): Promise<boolean> {
    try {
      // Simple query to test the connection
      const { error } = await this.supabase
        .from(this.TABLE_NAME)
        .select('id')
        .limit(1);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async getLastQuotation(): Promise<SavedQuotation | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data ? this.toSavedQuotation(data) : null;
    } catch (error) {
      console.error('Error fetching last quotation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to fetch last quotation: ${errorMessage}`);
    }
  }
}

// Create a singleton instance
let quotationService: QuotationService;

// Export a function to initialize the service with a Supabase client
// Accept any client that has the Database type structure (handles both SSR and regular clients)
export function initializeQuotationService(supabaseClient: SupabaseClient<Database> | any) {
  if (!quotationService) {
    quotationService = QuotationService.getInstance(supabaseClient);
  }
  return quotationService;
}

// Export a function to get the service instance
export function getQuotationService(): QuotationService {
  if (!quotationService) {
    throw new Error('QuotationService has not been initialized. Call initializeQuotationService first.');
  }
  return quotationService;
}
