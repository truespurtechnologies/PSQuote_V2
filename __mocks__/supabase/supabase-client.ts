// Mock Supabase client for testing
import { jest } from '@jest/globals';

// Simple mock without complex typing to avoid Jest type conflicts
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(() => Promise.resolve({
      data: { session: null },
      error: null,
    })),
    signInWithPassword: jest.fn(() => Promise.resolve({
      data: { user: null, session: null },
      error: new Error('Not implemented'),
    })),
    signUp: jest.fn(() => Promise.resolve({
      data: { user: null, session: null },
      error: new Error('Not implemented'),
    })),
    signOut: jest.fn(() => Promise.resolve({
      error: null,
    })),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
    refreshSession: jest.fn(() => Promise.resolve({
      data: { session: null },
      error: null,
    })),
    updateUser: jest.fn(() => Promise.resolve({
      data: { user: null },
      error: new Error('Not implemented'),
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: null,
          error: null,
        })),
        data: jest.fn(() => Promise.resolve({
          data: [],
          error: null,
        })),
      })),
      data: jest.fn(() => Promise.resolve({
        data: [],
        error: null,
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: null,
          error: null,
        })),
        data: jest.fn(() => Promise.resolve({
          data: [],
          error: null,
        })),
      })),
      data: jest.fn(() => Promise.resolve({
        data: null,
        error: null,
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: jest.fn(() => Promise.resolve({
          data: null,
          error: null,
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: jest.fn(() => Promise.resolve({
          data: null,
          error: null,
        })),
      })),
    })),
  })),
  rpc: jest.fn(() => Promise.resolve({
    data: null,
    error: null,
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(() => Promise.resolve({
        data: { path: 'test-path' },
        error: null,
      })),
      getPublicUrl: jest.fn(() => ({
        data: { publicUrl: 'https://test-url' },
      })),
    })),
  },
};

export const supabase = mockSupabaseClient;

export const getCurrentSession = jest.fn(() => Promise.resolve(null));
export const refreshSession = jest.fn(() => Promise.resolve(null));

export default supabase;
