const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestUser() {
  try {
    // Create auth user
    const { data: authUser, error: signUpError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'Test@1234',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test User',
        username: 'testuser',
        role: 'admin'
      }
    });

    if (signUpError) throw signUpError;

    console.log('Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: Test@1234');
    
  } catch (error) {
    console.error('Error creating test user:', error.message);
  }
}

addTestUser();
