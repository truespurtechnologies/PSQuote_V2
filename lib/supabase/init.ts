'use client';

import { createClient } from '../supabase-client';
import { initializeQuotationService } from './quotation-service';

let isInitialized = false;

// Initialize Supabase client and services
export function initializeSupabaseServices() {
  if (isInitialized) return;
  
  try {
    const supabaseClient = createClient();
    
    // Initialize all services that depend on Supabase
    initializeQuotationService(supabaseClient);
    
    isInitialized = true;
    console.log('Supabase services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Supabase services:', error);
    throw error;
  }
}

// Export initialized services
export * from './quotation-service';
