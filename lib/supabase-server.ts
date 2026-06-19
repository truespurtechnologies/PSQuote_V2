import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { Database } from './types/supabase'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()
  
  return createPagesServerClient<Database>({
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  }, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  })
}
