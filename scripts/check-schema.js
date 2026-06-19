const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    // Check if quotations table exists
    const { data: tableExists, error: tableError } = await supabase
      .rpc('table_exists', { table_name: 'quotations' });

    if (tableError) throw tableError;

    if (!tableExists) {
      console.log('The quotations table does not exist in the database');
      return;
    }

    console.log('quotations table exists. Checking columns...');

    // Get table structure
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'quotations');

    if (columnsError) throw columnsError;

    console.log('Current columns in quotations table:');
    console.table(columns);

  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema();
