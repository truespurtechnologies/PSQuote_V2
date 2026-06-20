#!/usr/bin/env node

/**
 * Comprehensive debugging script for quotation edit/save issues
 */

console.log('🔍 PSQuote Edit/Save Issue Analysis');
console.log('=====================================');

console.log('\n📋 Potential Issues to Check:');
console.log('1. RLS (Row Level Security) Policies');
console.log('2. User authentication status');
console.log('3. Database schema mismatches');
console.log('4. Form validation errors');
console.log('5. Network connectivity issues');
console.log('6. JavaScript errors in browser');

console.log('\n🔧 Debugging Steps:');
console.log('===================');

console.log('\n1. CHECK BROWSER CONSOLE:');
console.log('   - Open Developer Tools (F12)');
console.log('   - Go to Console tab');
console.log('   - Look for red error messages');
console.log('   - Try saving and watch for errors');

console.log('\n2. CHECK NETWORK TAB:');
console.log('   - Go to Network tab in DevTools');
console.log('   - Try saving the quotation');
console.log('   - Look for failed requests (red)');
console.log('   - Check request/response details');

console.log('\n3. CHECK AUTHENTICATION:');
console.log('   - Are you logged in?');
console.log('   - Try logging out and back in');
console.log('   - Check if user session is valid');

console.log('\n4. CHECK DATABASE PERMISSIONS:');
console.log('   - Run this SQL in Supabase SQL Editor:');
console.log('   ```sql');
console.log('   -- Check if user owns the quotation');
console.log('   SELECT id, quotation_number, created_by FROM quotations;');
console.log('   ');
console.log('   -- Check RLS policies');
console.log('   SELECT * FROM pg_policies WHERE tablename = \'quotations\';');
console.log('   ```');

console.log('\n5. TEST WITH SIMPLE UPDATE:');
console.log('   - Try changing just one field');
console.log('   - Try changing customer name only');
console.log('   - Check if specific fields cause issues');

console.log('\n6. CHECK FORM VALIDATION:');
console.log('   - Are all required fields filled?');
console.log('   - Are there validation errors?');
console.log('   - Check if form is actually submitting');

console.log('\n🚨 Common Issues and Solutions:');
console.log('================================');

console.log('\n❌ ISSUE: RLS Policy Blocking Update');
console.log('💡 SOLUTION: Check if user.created_by matches quotation.created_by');
console.log('🔧 SQL: UPDATE quotations SET created_by = \'your-user-id\' WHERE id = \'quotation-id\';');

console.log('\n❌ ISSUE: Missing Required Fields');
console.log('💡 SOLUTION: Ensure all required fields are filled');
console.log('🔧 Check: customer_name, date, subtotal, grand_total');

console.log('\n❌ ISSUE: Database Schema Mismatch');
console.log('💡 SOLUTION: Run latest migrations');
console.log('🔧 SQL: SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 5;');

console.log('\n❌ ISSUE: JavaScript Error');
console.log('💡 SOLUTION: Check browser console for errors');
console.log('🔧 Look for: TypeError, ReferenceError, NetworkError');

console.log('\n📞 If issue persists:');
console.log('1. Take screenshot of browser console errors');
console.log('2. Take screenshot of Network tab failed requests');
console.log('3. Note the exact quotation ID you\'re trying to edit');
console.log('4. Check if issue happens with all quotations or specific ones');

console.log('\n✅ Quick Test:');
console.log('```javascript');
console.log('// Paste this in browser console');
console.log('const testQuotationUpdate = async () => {');
console.log('  const { data, error } = await supabase');
console.log('    .from(\'quotations\')');
console.log('    .update({ customer_name: \'Test Update \' + Date.now() })');
console.log('    .eq(\'id\', \'your-quotation-id\')');
console.log('    .select();');
console.log('  console.log(\'Result:\', { data, error });');
console.log('};');
console.log('testQuotationUpdate();');
console.log('```');
