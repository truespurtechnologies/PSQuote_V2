// This script uses the Supabase REST API to list all tables and their columns
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function listTables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔍 Listing tables using REST API...');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase environment variables.');
    return;
  }
  
  try {
    // 1. First, try to get the OpenAPI schema
    console.log('\n📋 Fetching OpenAPI schema...');
    const schemaUrl = `${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`;
    const schemaResponse = await fetch(schemaUrl, {
      headers: {
        'Accept': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!schemaResponse.ok) {
      console.log(`❌ Failed to fetch schema (${schemaResponse.status} ${schemaResponse.statusText})`);
      console.log('This might be due to RLS or insufficient permissions.');
      return;
    }
    
    const schema = await schemaResponse.json();
    
    if (schema.definitions) {
      console.log('\n📊 Tables found in the database:');
      console.log('--------------------------------');
      
      Object.entries(schema.definitions).forEach(([tableName, definition]) => {
        // Skip internal Supabase tables
        if (tableName.startsWith('_') || tableName.startsWith('pg_') || tableName === 'schema_migrations') {
          return;
        }
        
        console.log(`\n📌 Table: ${tableName}`);
        console.log('--------------------------------');
        
        if (definition.properties) {
          console.log('Columns:');
          Object.entries(definition.properties).forEach(([columnName, columnDef]) => {
            const type = columnDef.type || columnDef.format || 'unknown';
            const required = definition.required && definition.required.includes(columnName) ? 'REQUIRED' : 'nullable';
            console.log(`- ${columnName.padEnd(20)} ${type.padEnd(15)} ${required}`);
          });
        } else {
          console.log('No column information available');
        }
        
        // Try to get row count
        (async () => {
          try {
            const countResponse = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=count`, {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Range-Unit': 'items',
                'Prefer': 'count=exact'
              }
            });
            
            if (countResponse.ok) {
              const count = countResponse.headers.get('content-range')?.split('/')[1] || 'unknown';
              console.log(`Row count: ${count}`);
            }
          } catch (e) {
            // Ignore errors for row count
          }
        })();
      });
      
      if (Object.keys(schema.definitions).length === 0) {
        console.log('No tables found in the database.');
      }
    } else {
      console.log('\nℹ️  No table definitions found in the schema.');
      console.log('This might be because:');
      console.log('1. The database is empty');
      console.log('2. Your API key has limited permissions');
      console.log('3. Row Level Security (RLS) is enabled');
      
      console.log('\n💡 Try checking your Supabase dashboard at:');
      console.log(`${supabaseUrl}/project/default/database/tables`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 This might be due to:');
    console.log('1. Network issues');
    console.log('2. Invalid Supabase URL or API key');
    console.log('3. CORS restrictions (try running this in a browser)');
  }
}

listTables().catch(console.error);
