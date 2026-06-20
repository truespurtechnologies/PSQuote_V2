import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('[test-admin] Testing admin client...')
    
    // Check environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('[test-admin] URL exists:', !!url)
    console.log('[test-admin] Service key exists:', !!key)
    
    if (!url || !key) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        hasUrl: !!url,
        hasKey: !!key
      }, { status: 500 })
    }
    
    // Try to create admin client
    const admin = createAdminClient()
    console.log('[test-admin] Admin client created')
    
    // Try a simple query
    const { data, error } = await admin.from('profiles').select('id').limit(1)
    
    if (error) {
      console.error('[test-admin] Query error:', error)
      return NextResponse.json({ 
        error: 'Database query failed',
        details: error 
      }, { status: 500 })
    }
    
    console.log('[test-admin] Query successful, rows:', data?.length || 0)
    
    return NextResponse.json({ 
      success: true,
      message: 'Admin client working correctly',
      rowCount: data?.length || 0
    })
  } catch (error: any) {
    console.error('[test-admin] Error:', error)
    return NextResponse.json({ 
      error: 'Unexpected error',
      message: error?.message || 'Unknown error',
      stack: error?.stack
    }, { status: 500 })
  }
}
