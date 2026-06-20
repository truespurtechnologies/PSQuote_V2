import { NextResponse } from 'next/server'
import { z } from 'zod'
import { log } from '../../../lib/logger'
import { rateLimiters } from '../../../lib/rate-limit'

// Ensure this route uses the Node.js runtime (required to access secure env vars)
export const runtime = 'nodejs'
// Avoid static optimization/caching for user listings
export const dynamic = 'force-dynamic'
import { createAdminClient } from '../../../lib/supabase-admin'
import type { AppUser } from '../../../lib/types/user'

// Input sanitization utilities
const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, ''); // Remove potential HTML tags
};

const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

// Zod validation schema for user creation with sanitization
const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be at most 50 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens').transform(sanitizeString),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters').transform(sanitizeString),
  email: z.string().email('Invalid email format').transform(sanitizeEmail),
  role: z.enum(['USER', 'ADMIN', 'MANAGER'], { errorMap: () => ({ message: 'Role must be USER, ADMIN, or MANAGER' }) }),
  status: z.enum(['ACTIVE', 'INACTIVE'], { errorMap: () => ({ message: 'Status must be ACTIVE or INACTIVE' }) }).optional().default('ACTIVE'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number').optional(),
})

// GET /api/users
export async function GET(request: Request) {
  // Apply rate limiting
  const rateLimitResult = await rateLimiters.users(request);
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }

  try {
    log.info('Starting users API request');
    
    // Validate required environment variables in production
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    log.debug('Environment variables check', {
      hasUrl: !!url,
      hasServiceRoleKey: !!serviceKey,
      nodeEnv: process.env.NODE_ENV,
    })
    
    if (!url || !serviceKey) {
      log.error('Missing environment variables for users API');
      return NextResponse.json({ error: 'Server is missing required configuration' }, { status: 500 })
    }

    log.debug('Creating admin client for users API');
    const admin = createAdminClient()
    log.debug('Admin client created successfully');

    // 1) List auth users (paginate if needed)
    log.debug('Fetching auth users');
    const { data: usersPage, error: adminErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (adminErr) {
      log.error('Failed to list auth users', { error: adminErr });
      return NextResponse.json({ error: 'Failed to list users', details: adminErr }, { status: 500 })
    }

    const authUsers = usersPage?.users || []
    log.info('Found auth users', { count: authUsers.length });
    const ids = authUsers.map(u => u.id)

    // 2) Fetch profiles for those IDs
    let profilesById = new Map<string, any>()
    if (ids.length > 0) {
      log.debug('Fetching profiles for users', { userCount: ids.length });
      const { data: profiles, error: profErr } = await admin
        .from('profiles')
        .select('*')
        .in('id', ids)
      if (profErr) {
        log.error('Failed to query profiles', { error: profErr });
        return NextResponse.json({ error: 'Failed to query profiles', details: profErr }, { status: 500 })
      }
      log.info('Found user profiles', { count: profiles?.length || 0 });
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

    log.info('Successfully mapped users data', { userCount: result.length });
    return NextResponse.json({ users: result }, {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    })
  } catch (error: any) {
    log.error('Unexpected error in users API', {
      error: error?.message || 'Unknown error',
      stack: error?.stack
    });
    return NextResponse.json({ 
      error: 'Unexpected server error',
      message: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/users
// Body: { username, name, email, role, status, password }
export async function POST(request: Request) {
  // Apply rate limiting
  const rateLimitResult = await rateLimiters.users(request);
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }

  try {
    const admin = createAdminClient()
    const body = await request.json()

    // Validate input with Zod
    const validationResult = createUserSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: errors 
      }, { status: 400 })
    }

    const validatedData = validationResult.data
    const username: string = validatedData.username.trim()
    const name: string = validatedData.name.trim()
    const email: string = validatedData.email.trim()
    const roleInput: string = validatedData.role
    const roleMeta = roleInput.toLowerCase() // store in profiles as lowercase
    const statusInput: string = validatedData.status
    const isActive: boolean = statusInput === 'ACTIVE'
    const password: string | undefined = validatedData.password

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
      log.error('Failed to create auth user', { error: createErr });
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
      log.error('Failed to upsert user profile', { error: profUpErr });
      return NextResponse.json({ error: 'Failed to upsert profile' }, { status: 500 })
    }

    // 3) Load merged user back to client shape
    const { data: profile, error: profErr } = await admin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (profErr) {
      log.error('Failed to fetch user profile', { error: profErr });
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

    return NextResponse.json({ user: appUser }, { 
      status: 201,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    })
  } catch (error) {
    log.error('Unexpected error in POST users API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
