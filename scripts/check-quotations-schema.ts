import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

async function checkQuotationsTable() {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Checking quotations table schema...');
    
    // Get table information
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'quotations' });

    if (tableError) {
      console.log('Using fallback method to get table info...');
      // Fallback method if the function doesn't exist
      const { data: columns, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('*')
        .eq('table_name', 'quotations')
        .eq('table_schema', 'public');

      if (columnError) {
        console.error('Error fetching table columns:', columnError);
        return;
      }

      console.log('\nTable: public.quotations');
      console.log('Columns:');
      columns.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}${col.is_nullable === 'YES' ? ' (nullable)' : ''}`);
        if (col.column_default) {
          console.log(`  Default: ${col.column_default}`);
        }
      });

      // Get constraints
      const { data: constraints, error: constraintError } = await supabase
        .from('information_schema.table_constraints')
        .select('*')
        .eq('table_name', 'quotations')
        .eq('table_schema', 'public');

      if (!constraintError && constraints && constraints.length > 0) {
        console.log('\nConstraints:');
        constraints.forEach(constraint => {
          console.log(`- ${constraint.constraint_type}: ${constraint.constraint_name}`);
        });
      }
    } else {
      console.log('Table info:', JSON.stringify(tableInfo, null, 2));
    }

    // Get sample data
    console.log('\nFetching sample data...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('quotations')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('Error fetching sample data:', sampleError);
    } else if (sampleData && sampleData.length > 0) {
      console.log('\nSample row:');
      console.log(JSON.stringify(sampleData[0], null, 2));
    } else {
      console.log('No data found in quotations table');
    }

  } catch (error) {
    console.error('Error checking quotations table:', error);
  }
}

checkQuotationsTable();
