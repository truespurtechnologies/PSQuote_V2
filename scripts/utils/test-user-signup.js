// This script tests the user signup flow and verifies profile creation
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testUserSignup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🧪 Testing user signup and profile creation...');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase environment variables.');
    return;
  }
  
  // Generate a unique email for testing
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'Test@123456';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Step 1: Sign up a new user
    console.log('\n🔐 Signing up a test user...');
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: `testuser_${Date.now()}`,
          full_name: 'Test User',
          role: 'user'
        }
      }
    });
    
    if (signUpError) {
      console.error('❌ Error signing up user:', signUpError.message);
      return;
    }
    
    console.log('✅ User signed up successfully!');
    console.log('User ID:', authData.user.id);
    
    // Step 2: Verify the profile was created
    console.log('\n🔍 Checking profile creation...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError || !profileData) {
      console.error('❌ Error fetching profile:', profileError?.message || 'Profile not found');
      return;
    }
    
    console.log('✅ Profile created successfully!');
    console.log('Profile data:', JSON.stringify(profileData, null, 2));
    
    // Step 3: Clean up (delete test user)
    console.log('\n🧹 Cleaning up test user...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
    
    if (deleteError) {
      console.log('⚠️  Could not delete test user (you may need to do this manually):', deleteError.message);
    } else {
      console.log('✅ Test user cleaned up successfully!');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testUserSignup().catch(console.error);
