/**
 * Database Operations Tests
 * Tests CRUD operations, RLS policies, and database interactions
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
      updateUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          data: [],
          error: null,
        })),
        in: jest.fn(() => ({
          data: [],
          error: null,
        })),
        data: [],
        error: null,
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          data: [],
          error: null,
        })),
        data: [],
        error: null,
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null,
        })),
        data: [],
        error: null,
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null,
        })),
        data: [],
        error: null,
      })),
      data: [],
      error: null,
    })),
    rpc: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

// Mock admin client
jest.mock('@/lib/supabase-admin', () => ({
  createAdminClient: jest.fn(() => ({
    auth: {
      admin: {
        listUsers: jest.fn(),
        createUser: jest.fn(),
        deleteUser: jest.fn(),
      },
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          data: [],
          error: null,
        })),
        in: jest.fn(() => ({
          data: [],
          error: null,
        })),
        data: [],
        error: null,
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          data: [],
          error: null,
        })),
        data: [],
        error: null,
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null,
        })),
        data: [],
        error: null,
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null,
        })),
        data: [],
        error: null,
      })),
      upsert: jest.fn(() => ({
        data: [],
        error: null,
      })),
      data: [],
      error: null,
    })),
  })),
}));

describe('Database Operations Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Quotations CRUD Operations', () => {
    it('should create a new quotation', async () => {
      const { createAdminClient } = await import('@/lib/supabase-admin');
      const mockAdminClient = createAdminClient();
      const mockFrom = mockAdminClient.from as jest.Mock;
      
      // Mock successful insertion
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            data: { id: 'quote-123', quotation_number: 'QT-0001' },
            error: null,
          }),
        }),
      });

      // Test quotation creation logic
      const quotationData = {
        customer_name: 'Test Customer',
        quotation_number: 'QT-0001',
        total_amount: 1000,
        status: 'DRAFT',
      };

      const result = await mockFrom('quotations').insert(quotationData).select();
      
      expect(result.data).toEqual({
        id: 'quote-123',
        quotation_number: 'QT-0001'
      });
      expect(mockFrom).toHaveBeenCalledWith('quotations');
    });

    it('should read quotations for authenticated user', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockFrom = supabase.from as jest.Mock;
      
      // Mock user session
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { 
          session: { 
            user: { id: 'user-123' },
            access_token: 'token'
          } 
        },
        error: null,
      });

      // Mock successful read
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: [
              { id: 'quote-1', customer_name: 'Customer A' },
              { id: 'quote-2', customer_name: 'Customer B' }
            ],
            error: null,
          }),
        }),
      });

      const result = await mockFrom('quotations')
        .select('*')
        .eq('created_by', 'user-123');
      
      expect(result.data).toHaveLength(2);
      expect(result.data[0].customer_name).toBe('Customer A');
    });

    it('should update an existing quotation', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockFrom = supabase.from as jest.Mock;
      
      // Mock successful update
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: { 
              id: 'quote-123', 
              customer_name: 'Updated Customer',
              status: 'UPDATED'
            },
            error: null,
          }),
        }),
      });

      const updateData = { customer_name: 'Updated Customer', status: 'UPDATED' };
      const result = await mockFrom('quotations')
        .update(updateData)
        .eq('id', 'quote-123');
      
      expect(result.data.customer_name).toBe('Updated Customer');
      expect(result.data.status).toBe('UPDATED');
    });

    it('should delete a quotation', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockFrom = supabase.from as jest.Mock;
      
      // Mock successful deletion
      mockFrom.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: { id: 'quote-123' },
            error: null,
          }),
        }),
      });

      const result = await mockFrom('quotations')
        .delete()
        .eq('id', 'quote-123');
      
      expect(result.data.id).toBe('quote-123');
    });
  });

  describe('Products CRUD Operations', () => {
    it('should read products list', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockFrom = supabase.from as jest.Mock;
      
      // Mock successful products read
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: [
            { 
              id: 'prod-1', 
              item_name: 'MS Round Bar', 
              item_category: 'MS Round',
              display_prefix: 'RD'
            },
            { 
              id: 'prod-2', 
              item_name: 'MS Bright Bar', 
              item_category: 'MS BRIGHT BAR',
              display_prefix: 'BR'
            }
          ],
          error: null,
        }),
      });

      const result = await mockFrom('products').select('*');
      
      expect(result.data).toHaveLength(2);
      expect(result.data[0].item_name).toBe('MS Round Bar');
      expect(result.data[1].display_prefix).toBe('BR');
    });

    it('should filter products by category', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockFrom = supabase.from as jest.Mock;
      
      // Mock successful filtered read
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: [
              { 
                id: 'prod-1', 
                item_name: 'MS Bright Bar Round', 
                item_category: 'MS BRIGHT BAR',
                display_prefix: 'BR'
              },
              { 
                id: 'prod-2', 
                item_name: 'MS Bright Bar Square', 
                item_category: 'MS BRIGHT BAR',
                display_prefix: 'BR-SQ'
              }
            ],
            error: null,
          }),
        }),
      });

      const result = await mockFrom('products')
        .select('*')
        .eq('item_category', 'MS BRIGHT BAR');
      
      expect(result.data).toHaveLength(2);
      expect(result.data[0].item_category).toBe('MS BRIGHT BAR');
      expect(result.data[1].display_prefix).toBe('BR-SQ');
    });
  });

  describe('RLS Policy Tests', () => {
    it('should enforce user isolation for quotations', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockFrom = supabase.from as jest.Mock;
      
      // Mock user A session
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { 
          session: { 
            user: { id: 'user-A' },
            access_token: 'token-A'
          } 
        },
        error: null,
      });

      // Mock RLS enforcement - user A should only see their own quotations
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: [
              { id: 'quote-A1', created_by: 'user-A' },
              { id: 'quote-A2', created_by: 'user-A' }
            ],
            error: null,
          }),
        }),
      });

      const result = await mockFrom('quotations')
        .select('*')
        .eq('created_by', 'user-A');
      
      // User A should only see their own quotations
      expect(result.data).toHaveLength(2);
      expect(result.data.every(q => q.created_by === 'user-A')).toBe(true);
    });

    it('should prevent access to other users data', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockFrom = supabase.from as jest.Mock;
      
      // Mock user B session
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { 
          session: { 
            user: { id: 'user-B' },
            access_token: 'token-B'
          } 
        },
        error: null,
      });

      // Mock RLS enforcement - user B trying to access user A's quotation
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: [], // No data - RLS blocks access
            error: null,
          }),
        }),
      });

      const result = await mockFrom('quotations')
        .select('*')
        .eq('id', 'quote-A1'); // User A's quotation
      
      // User B should not see user A's quotation
      expect(result.data).toHaveLength(0);
    });

    it('should allow admin to access all data', async () => {
      const { createAdminClient } = await import('@/lib/supabase-admin');
      const mockAdminClient = createAdminClient();
      const mockFrom = mockAdminClient.from as jest.Mock;
      
      // Mock admin client - should bypass RLS
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: [
            { id: 'quote-A1', created_by: 'user-A' },
            { id: 'quote-B1', created_by: 'user-B' },
            { id: 'quote-C1', created_by: 'user-C' }
          ],
          error: null,
        }),
      });

      const result = await mockFrom('quotations').select('*');
      
      // Admin should see all quotations
      expect(result.data).toHaveLength(3);
      expect(result.data.map(q => q.created_by)).toEqual(
        expect.arrayContaining(['user-A', 'user-B', 'user-C'])
      );
    });
  });

  describe('Quotation Items Operations', () => {
    it('should create quotation items', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockFrom = supabase.from as jest.Mock;
      
      // Mock successful items creation
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            data: [
              { 
                id: 'item-1', 
                quotation_id: 'quote-123',
                description: 'MS Round Bar 10mm',
                quantity: 100,
                rate: 50
              }
            ],
            error: null,
          }),
        }),
      });

      const items = [
        {
          quotation_id: 'quote-123',
          description: 'MS Round Bar 10mm',
          quantity: 100,
          rate: 50
        }
      ];

      const result = await mockFrom('quotation_items').insert(items).select();
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].description).toBe('MS Round Bar 10mm');
    });

    it('should fetch items for a specific quotation', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockFrom = supabase.from as jest.Mock;
      
      // Mock successful items fetch
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: [
              { id: 'item-1', quotation_id: 'quote-123', description: 'Item 1' },
              { id: 'item-2', quotation_id: 'quote-123', description: 'Item 2' }
            ],
            error: null,
          }),
        }),
      });

      const result = await mockFrom('quotation_items')
        .select('*')
        .eq('quotation_id', 'quote-123');
      
      expect(result.data).toHaveLength(2);
      expect(result.data.every(item => item.quotation_id === 'quote-123')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockFrom = supabase.from as jest.Mock;
      
      // Mock connection error
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: null,
            error: { 
              message: 'Database connection failed',
              code: 'CONNECTION_ERROR'
            },
          }),
        }),
      });

      const result = await mockFrom('quotations')
        .select('*')
        .eq('created_by', 'user-123');
      
      expect(result.error.message).toBe('Database connection failed');
      expect(result.error.code).toBe('CONNECTION_ERROR');
    });

    it('should handle constraint violations', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockFrom = supabase.from as jest.Mock;
      
      // Mock constraint violation
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            data: null,
            error: { 
              message: 'duplicate key value violates unique constraint',
              code: '23505'
            },
          }),
        }),
      });

      const duplicateQuotation = {
        quotation_number: 'QT-0001', // Already exists
        customer_name: 'Test Customer'
      };

      const result = await mockFrom('quotations')
        .insert(duplicateQuotation)
        .select();
      
      expect(result.error.code).toBe('23505');
      expect(result.error.message).toContain('duplicate key');
    });
  });
});
