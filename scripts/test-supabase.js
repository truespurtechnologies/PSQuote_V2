console.log('Testing Supabase connection...');

// Try to load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Not set');
console.log('Supabase Key:', supabaseKey ? '✅ Set' : '❌ Not set');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Error: Missing required environment variables');
  process.exit(1);
}

// Test a simple Supabase query
const { createClient } = require('@supabase/ssr');
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Don't persist session for this test
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

async function testConnection() {
  try {
    console.log('\nTesting Supabase connection...');
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
      console.error('❌ Error connecting to Supabase:', error.message);
      if (error.message.includes('JWT expired')) {
        console.log('\n💡 Tip: Your Supabase JWT token might be expired. Check your Supabase project settings.');
      }
    } else {
      console.log('✅ Successfully connected to Supabase!');
      console.log('Sample data:', data);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testConnection();
