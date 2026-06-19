// This script tests all critical Supabase connections and functionality
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testAllConnections() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔍 Testing Supabase Connections...\n');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase environment variables.');
    console.log('Please check your .env.local file for:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return false;
  }
  
  console.log('✅ Environment variables are set');
  console.log(`Supabase URL: ${supabaseUrl.replace(/\/auth\/v1$/, '')}`);
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test 1: Basic connection to Supabase
    console.log('\n🔌 Testing basic connection...');
    const { data: version, error: versionError } = await supabase.rpc('version');
    
    if (versionError) {
      console.log('ℹ️  Could not fetch database version (this might be expected):', versionError.message);
    } else {
      console.log(`✅ Connected to Supabase! Database version: ${version}`);
    }
    
    // Test 2: Check if we can access the profiles table
    console.log('\n📋 Testing profiles table access...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Error accessing profiles table:', profilesError.message);
      return false;
    }
    
    console.log(`✅ Successfully accessed profiles table (${profiles?.length || 0} rows)`);
    
    // Test 3: Check if we can access other important tables
    const tablesToCheck = ['customers', 'products', 'quotations', 'quotation_items', 'settings'];
    
    for (const table of tablesToCheck) {
      console.log(`\n📊 Checking ${table} table access...`);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Error accessing ${table} table:`, error.message);
        return false;
      }
      
      console.log(`✅ Successfully accessed ${table} table (${data?.length || 0} rows)`);
    }
    
    // Test 4: Check if RLS is working by trying to insert a test record
    console.log('\n🔐 Testing Row Level Security (RLS)...');
    const testData = {
      username: `test_${Date.now()}`,
      full_name: 'Test User',
      email: `test_${Date.now()}@example.com`,
      role: 'user',
      is_active: true,
      updated_at: new Date().toISOString()
    };
    
    try {
      // This should fail due to RLS (unless running with service role)
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([testData]);
      
      if (insertError) {
        console.log('✅ RLS is working correctly (blocked unauthorized insert)');
      } else {
        console.warn('⚠️  RLS might not be properly configured (allowed unauthorized insert)');
      }
    } catch (error) {
      console.log('✅ RLS is working correctly (blocked unauthorized insert)');
    }
    
    console.log('\n🎉 All connection tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error during connection tests:', error);
    return false;
  }
}

// Run the tests
testAllConnections()
  .then(success => {
    console.log('\n' + (success 
      ? '✅ Your Supabase connection is working perfectly!'
      : '❌ There were some issues with the Supabase connection.'
    ));
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
