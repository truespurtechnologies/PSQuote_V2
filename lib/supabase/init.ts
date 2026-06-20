'use client';

import { supabase } from './client';
import { initializeQuotationService } from './quotation-service';

let isInitialized = false;

// Initialize Supabase client and services
export function initializeSupabaseServices() {
  if (isInitialized) return;
  
  try {
    // Use the singleton supabase client
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }
    
    // Initialize all services that depend on Supabase
    // Type assertion needed due to minor type differences between generated types
    initializeQuotationService(supabase as any);
    
    isInitialized = true;
    console.log('Supabase services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Supabase services:', error);
    throw error;
  }
}

// Export initialized services
export * from './quotation-service';
