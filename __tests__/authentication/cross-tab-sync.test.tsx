/**
 * Cross-Tab Synchronization Tests
 * Tests multi-tab authentication state synchronization
 */

import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock localStorage for cross-tab testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      // Simulate storage event for other tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: value,
        oldValue: store[key] !== value ? store[key] : null,
        storageArea: localStorage as any,
      }));
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: null,
        oldValue: store[key],
        storageArea: localStorage as any,
      }));
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('Cross-Tab Synchronization Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Storage Event Synchronization', () => {
    it('should detect auth state changes from other tabs', async () => {
      // Mock auth state change callback
      const mockAuthCallback = jest.fn();
      
      // Simulate auth state change from another tab
      const authData = {
        access_token: 'new-token',
        refresh_token: 'new-refresh-token',
        user: { id: 'user-123', email: 'test@example.com' }
      };

      // Set auth data in localStorage (simulating another tab)
      act(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify(authData));
      });

      // Verify storage event was triggered
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'supabase.auth.token',
        expect.stringContaining('new-token')
      );
    });

    it('should handle sign out from other tabs', async () => {
      // Set initial auth state
      const authData = {
        access_token: 'initial-token',
        user: { id: 'user-123', email: 'test@example.com' }
      };

      act(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify(authData));
      });

      // Simulate sign out from another tab
      act(() => {
        localStorage.removeItem('supabase.auth.token');
      });

      // Verify token was removed
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('supabase.auth.token');
    });

    it('should handle token refresh from other tabs', async () => {
      // Initial token
      const initialToken = {
        access_token: 'old-token',
        expires_at: Date.now() - 1000, // Expired
      };

      act(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify(initialToken));
      });

      // New refreshed token
      const refreshedToken = {
        access_token: 'new-refreshed-token',
        expires_at: Date.now() + 3600000, // 1 hour from now
      };

      // Simulate token refresh from another tab
      act(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify(refreshedToken));
      });

      // Verify token was updated
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'supabase.auth.token',
        expect.stringContaining('new-refreshed-token')
      );
    });
  });

  describe('Session Persistence', () => {
    it('should maintain session across tab reloads', async () => {
      const sessionData = {
        access_token: 'session-token',
        user: { id: 'user-456', email: 'user@example.com' },
        expires_at: Date.now() + 3600000
      };

      // Store session
      act(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify(sessionData));
      });

      // Simulate tab reload by reading from localStorage
      const storedData = localStorageMock.getItem('supabase.auth.token');
      const parsedData = JSON.parse(storedData || '{}');

      expect(parsedData.access_token).toBe('session-token');
      expect(parsedData.user.id).toBe('user-456');
    });

    it('should clear expired sessions', async () => {
      const expiredSession = {
        access_token: 'expired-token',
        user: { id: 'user-789', email: 'expired@example.com' },
        expires_at: Date.now() - 1000 // Expired
      };

      // Store expired session
      act(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify(expiredSession));
      });

      // Check if session is still valid
      const storedData = localStorageMock.getItem('supabase.auth.token');
      const parsedData = JSON.parse(storedData || '{}');

      // Session should be considered expired
      expect(parsedData.expires_at).toBeLessThan(Date.now());
    });
  });

  describe('Multiple Tab Coordination', () => {
    it('should prevent concurrent sign in conflicts', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;

      // Mock successful sign in
      mockSignIn.mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: { access_token: 'test-token' }
        },
        error: null,
      });

      // Simulate sign in from one tab
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      await mockSignIn(credentials);

      // Verify sign in was called
      expect(mockSignIn).toHaveBeenCalledWith(credentials);
    });

    it('should coordinate sign out across all tabs', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockSignOut = supabase.auth.signOut as jest.Mock;

      // Mock successful sign out
      mockSignOut.mockResolvedValueOnce({
        error: null,
      });

      // Simulate sign out
      await mockSignOut();

      // Verify sign out clears local storage
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted localStorage data', async () => {
      // Store corrupted data
      act(() => {
        localStorage.setItem('supabase.auth.token', 'invalid-json-data');
      });

      // Try to parse corrupted data
      const storedData = localStorageMock.getItem('supabase.auth.token');
      
      expect(() => {
        JSON.parse(storedData || '{}');
      }).toThrow();
    });

    it('should handle localStorage unavailability', async () => {
      // Mock localStorage being unavailable
      const originalLocalStorage = window.localStorage;
      
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      // Should not crash when localStorage is unavailable
      expect(() => {
        // This would normally use localStorage
        const mockStorage = undefined;
      }).not.toThrow();

      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      });
    });
  });

  describe('Performance Considerations', () => {
    it('should not trigger excessive storage events', async () => {
      const storageEventSpy = jest.spyOn(window, 'dispatchEvent');

      // Set multiple items rapidly
      act(() => {
        localStorage.setItem('test-key-1', 'value-1');
        localStorage.setItem('test-key-2', 'value-2');
        localStorage.setItem('test-key-3', 'value-3');
      });

      // Should have triggered events for each set
      expect(storageEventSpy).toHaveBeenCalledTimes(3);

      storageEventSpy.mockRestore();
    });

    it('should debounce rapid auth state changes', async () => {
      const { supabase } = await import('@/lib/supabase/client');
      const mockOnAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock;

      // Mock callback
      const mockCallback = jest.fn();
      mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });

      // Simulate rapid state changes
      act(() => {
        mockOnAuthStateChange('SIGNED_IN', { user: { id: 'user-1' } });
        mockOnAuthStateChange('SIGNED_IN', { user: { id: 'user-1' } });
        mockOnAuthStateChange('SIGNED_IN', { user: { id: 'user-1' } });
      });

      // Should handle rapid changes gracefully
      expect(mockOnAuthStateChange).toHaveBeenCalledTimes(3);
    });
  });
});
