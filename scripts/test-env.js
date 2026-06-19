// Simple script to test environment variables
console.log('Testing environment variables...');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Check if required variables exist
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

let allVarsPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}: ${value ? '✅' : '❌'} ${value || 'Not set'}`);
  if (!value) allVarsPresent = false;
});

if (!allVarsPresent) {
  console.error('\n❌ Error: Some required environment variables are missing');
  console.log('\nPlease make sure your .env.local file exists in the project root and contains:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

console.log('\n✅ All required environment variables are present!');
