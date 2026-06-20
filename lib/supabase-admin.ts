import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Server-side admin client using the Service Role key
// IMPORTANT: Never expose the service role key to the browser.
export const createAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set on the server environment')
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
