// This script will check and fix common permission issues with Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixPermissions() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔒 Checking and fixing permissions...');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase environment variables.');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // 1. Check if we can query the profiles table
    console.log('\n🔍 Testing profiles table access...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Cannot access profiles table:', profilesError.message);
      console.log('\n🔧 Attempting to fix permissions...');
      
      // Try to fix permissions
      const { error: fixError } = await supabase.rpc('pg_temp.execute_sql', {
        query: `
          -- Grant necessary permissions on the profiles table
          GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
          
          -- Allow public access to the profiles table (adjust as needed)
          ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
          
          -- Create a policy to allow users to see all profiles
          DROP POLICY IF EXISTS "Allow public read access" ON public.profiles;
          CREATE POLICY "Allow public read access" 
            ON public.profiles 
            FOR SELECT 
            USING (true);
            
          -- Allow users to update their own profile
          DROP POLICY IF EXISTS "Allow individual update access" ON public.profiles;
          CREATE POLICY "Allow individual update access"
            ON public.profiles 
            FOR UPDATE 
            USING (auth.uid() = id);
            
          -- Allow users to insert their own profile
          DROP POLICY IF EXISTS "Allow individual insert access" ON public.profiles;
          CREATE POLICY "Allow individual insert access"
            ON public.profiles 
            FOR INSERT 
            WITH CHECK (auth.uid() = id);
            
          -- Allow users to delete their own profile
          DROP POLICY IF EXISTS "Allow individual delete access" ON public.profiles;
          CREATE POLICY "Allow individual delete access"
            ON public.profiles 
            FOR DELETE 
            USING (auth.uid() = id);
        `
      });
      
      if (fixError) {
        console.error('❌ Failed to fix permissions:', fixError.message);
        console.log('\n💡 You may need to run these SQL commands manually in the Supabase SQL editor:');
        console.log(`1. Go to: ${supabaseUrl}/project/default/sql`);
        console.log('2. Run the SQL commands from the fix-permissions.js script');
        return;
      }
      
      console.log('✅ Successfully updated permissions!');
      
      // Verify the fix
      const { data: fixedProfiles, error: fixedError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (fixedError) {
        console.log('❌ Still cannot access profiles table after fix:', fixedError.message);
      } else {
        console.log('✅ Success! Can now access profiles table.');
        console.log('Sample profile data:', JSON.stringify(fixedProfiles, null, 2));
      }
    } else {
      console.log('✅ Can access profiles table successfully!');
      console.log('Sample profile data:', JSON.stringify(profiles, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixPermissions().catch(console.error);
