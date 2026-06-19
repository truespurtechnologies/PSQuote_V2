const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing Supabase environment variables.');
  console.log('Please make sure you have set these variables in your .env.local file:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your-project-url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection
async function testConnection() {
  console.log('🔌 Testing Supabase connection...');
  
  try {
    // Simple query to test connection
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01') { // Table doesn't exist
        console.log('ℹ️  The "profiles" table doesn\'t exist yet.');
        console.log('Please create it in your Supabase dashboard or run the setup script.');
      } else {
        console.error('❌ Error connecting to Supabase:', error.message);
      }
      return;
    }

    console.log('✅ Successfully connected to Supabase!');
    if (data && data.length > 0) {
      console.log('📋 Sample data:', data);
    } else {
      console.log('ℹ️  No data found in the profiles table.');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();
