# Reload Supabase Schema Cache

## Problem
After running a migration, you get this error:
```
Could not find the 'created_by' column of 'loading_slips' in the schema cache (PGRST204)
```

This happens because Supabase's PostgREST API caches the database schema, and it hasn't been updated after your migration.

## Solution

### Option 1: Reload Schema via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on **API** in the left sidebar
4. Scroll down to find the **"Reload schema cache"** button
5. Click **"Reload schema cache"**
6. Wait a few seconds for the cache to refresh

### Option 2: Reload Schema via SQL

Run this SQL command in the Supabase SQL Editor:

```sql
NOTIFY pgrst, 'reload schema';
```

### Option 3: Restart Supabase (Local Development)

If you're running Supabase locally:

```bash
npx supabase stop
npx supabase start
```

## Verify the Fix

After reloading the schema cache, try saving a loading slip again. The error should be resolved.

## Why This Happens

- Supabase uses PostgREST to provide a REST API over your PostgreSQL database
- PostgREST caches the database schema for performance
- When you add new tables or columns via migrations, the cache needs to be refreshed
- This is a one-time operation after each schema change

## Related Error Codes

- **PGRST204**: Column not found in schema cache
- **PGRST116**: Table not found in schema cache

Both indicate the schema cache needs to be reloaded.
