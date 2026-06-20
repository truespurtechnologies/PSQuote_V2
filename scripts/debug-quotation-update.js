#!/usr/bin/env node

/**
 * Debug script to check quotation update issues
 * Run this in the browser console or as a Node.js script with proper env setup
 */

// Check if the user has permission to update the quotation
const debugQuotationUpdate = async (quotationId) => {
  console.log('🔍 Debugging quotation update issue...');
  console.log('Quotation ID:', quotationId);
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ Error getting user:', userError);
      return;
    }
    
    console.log('✅ Current user:', user?.id);
    
    // Check the quotation details
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', quotationId)
      .single();
      
    if (quotationError) {
      console.error('❌ Error fetching quotation:', quotationError);
      return;
    }
    
    console.log('✅ Quotation details:', quotation);
    console.log('📝 Quotation created_by:', quotation.created_by);
    console.log('👤 Current user ID:', user?.id);
    console.log('🔐 Can update:', quotation.created_by === user?.id);
    
    // Test update permission
    console.log('🧪 Testing update permission...');
    const { data: testUpdate, error: testError } = await supabase
      .from('quotations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', quotationId)
      .select('id, updated_at');
      
    if (testError) {
      console.error('❌ Update test failed:', testError);
      console.error('Error details:', {
        code: testError.code,
        message: testError.message,
        details: testError.details,
        hint: testError.hint
      });
    } else {
      console.log('✅ Update test successful:', testUpdate);
    }
    
    // Check RLS policies
    console.log('📋 Checking RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'quotations' });
      
    if (policyError) {
      console.error('❌ Error checking policies:', policyError);
    } else {
      console.log('✅ RLS policies:', policies);
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
};

// Usage in browser console:
// debugQuotationUpdate('your-quotation-id-here');

console.log('🔧 Quotation Update Debug Script Loaded');
console.log('Usage: debugQuotationUpdate("quotation-id")');
