import { NextResponse } from 'next/server'

// Ensure this route uses the Node.js runtime (required to access secure env vars)
export const runtime = 'nodejs'
// Avoid static optimization/caching for user listings
export const dynamic = 'force-dynamic'
import { createAdminClient } from '@/lib/supabase-admin'
import type { AppUser } from '@/lib/types/user'

// GET /api/users
export async function GET() {
  try {
    // Validate required environment variables in production
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      console.error('GET /api/users env validation failed', {
        hasUrl: !!url,
        hasServiceRoleKey: !!serviceKey,
        nodeEnv: process.env.NODE_ENV,
      })
      return NextResponse.json({ error: 'Server is missing required configuration' }, { status: 500 })
    }

    const admin = createAdminClient()

    // 1) List auth users (paginate if needed)
    const { data: usersPage, error: adminErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (adminErr) {
      console.error('admin.listUsers error:', adminErr)
      return NextResponse.json({ error: 'Failed to list users' }, { status: 500 })
    }

    const authUsers = usersPage?.users || []
    const ids = authUsers.map(u => u.id)

    // 2) Fetch profiles for those IDs
    let profilesById = new Map<string, any>()
    if (ids.length > 0) {
      const { data: profiles, error: profErr } = await admin
        .from('profiles')
        .select('*')
        .in('id', ids)

      if (profErr) {
        console.error('profiles query error:', profErr)
        return NextResponse.json({ error: 'Failed to query profiles' }, { status: 500 })
      }
      for (const p of profiles || []) profilesById.set(p.id, p)
    }

    // 3) Merge and map fields
    const result: AppUser[] = authUsers.map(u => {
      const p = profilesById.get(u.id) || {}
      const fullName: string = p.full_name || ''
      const username: string = p.username || ''
      const email: string = p.email || u.email || ''
      const role = (p.role || 'user').toString().toUpperCase() as any
      const isActive = (p.is_active ?? true) as boolean
      const status = isActive ? 'ACTIVE' : 'INACTIVE'
      const lastLogin = u.last_sign_in_at || ''

      return {
        id: u.id,
        username,
        name: fullName,
        email,
        role,
        status,
        lastLogin,
        lastUpdated: p.updated_at || new Date().toISOString(),
      } as AppUser
    })

    return NextResponse.json({ users: result })
  } catch (error) {
    console.error('GET /api/users error:', error)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}

// POST /api/users
// Body: { username, name, email, role, status, password }
export async function POST(request: Request) {
  try {
    const admin = createAdminClient()
    const body = await request.json()

    const username: string = body.username?.trim()
    const name: string = (body.name || '').toString().trim()
    const email: string = body.email?.toString().trim()
    const roleInput: string = (body.role || 'USER').toString().toUpperCase()
    const roleMeta = roleInput.toLowerCase() // store in profiles as lowercase
    const statusInput: string = (body.status || 'ACTIVE').toString().toUpperCase()
    const isActive: boolean = statusInput === 'ACTIVE'
    const password: string | undefined = body.password?.toString()

    if (!username || !email || !roleInput) {
      return NextResponse.json({ error: 'username, email and role are required' }, { status: 400 })
    }

    // 1) Create auth user with metadata used by trigger to populate profiles
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password, // optional
      user_metadata: {
        username,
        full_name: name,
        role: roleMeta,
        is_active: isActive,
      },
      email_confirm: true,
    })
    if (createErr) {
      console.error('admin.createUser error:', createErr)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
    const authUser = created?.user
    if (!authUser) {
      return NextResponse.json({ error: 'User not returned after creation' }, { status: 500 })
    }

    const userId = authUser.id

    // 2) Ensure profile row has the latest fields
    const { error: profUpErr } = await admin
      .from('profiles')
      .upsert({
        id: userId,
        username,
        email,
        full_name: name || username,
        role: roleMeta,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    if (profUpErr) {
      console.error('profiles upsert error:', profUpErr)
      return NextResponse.json({ error: 'Failed to upsert profile' }, { status: 500 })
    }

    // 3) Load merged user back to client shape
    const { data: profile, error: profErr } = await admin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (profErr) {
      console.error('profiles fetch error:', profErr)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    const appUser: AppUser = {
      id: userId,
      username: profile?.username || '',
      name: profile?.full_name || '',
      email: profile?.email || authUser.email || '',
      role: (profile?.role || 'user').toString().toUpperCase() as any,
      status: (profile?.is_active ?? true) ? 'ACTIVE' : 'INACTIVE',
      lastLogin: authUser.last_sign_in_at || '',
      lastUpdated: profile?.updated_at || new Date().toISOString(),
    }

    return NextResponse.json({ user: appUser }, { status: 201 })
  } catch (error) {
    console.error('POST /api/users error:', error)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
