import { NextRequest, NextResponse } from 'next/server'
// Ensure Node.js runtime for secure env access
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createAdminClient } from '../../../../lib/supabase-admin'

// Map UI role strings to stored profile role strings
const normalizeRole = (role: any) => {
  const r = String(role || '').toLowerCase()
  if (r === 'admin' || r === 'manager' || r === 'user') return r
  return 'user'
}

// PATCH /api/users/[id]
// Body can include: { name, username, email, role, status }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const admin = createAdminClient()
    const body = await req.json()

    const updates: any = {}
    if (typeof body.name === 'string') updates.full_name = body.name
    if (typeof body.username === 'string') updates.username = body.username
    if (typeof body.role === 'string') updates.role = normalizeRole(body.role)
    if (typeof body.status === 'string') updates.is_active = body.status === 'ACTIVE'
    if (typeof body.email === 'string') updates.email = body.email

    // 1) Update profile fields (public.profiles)
    if (Object.keys(updates).length > 0) {
      const { error: profErr } = await admin
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (profErr) {
        console.error('profiles update error:', profErr)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }
    }

    // 2) If email is provided, update auth.users email too
    if (typeof body.email === 'string') {
      const { data: updUser, error: authErr } = await admin.auth.admin.updateUserById(id, {
        email: body.email,
      })
      if (authErr) {
        console.error('auth update error:', authErr)
        return NextResponse.json({ error: 'Failed to update auth user' }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('PATCH /api/users/[id] error:', error)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}

// DELETE /api/users/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const admin = createAdminClient()

    // 1) Delete profile first to avoid FK issues
    const { error: profErr } = await admin
      .from('profiles')
      .delete()
      .eq('id', id)
    if (profErr) {
      console.error('profiles delete error:', profErr)
      return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 })
    }

    // 2) Delete auth user
    const { error: authErr } = await admin.auth.admin.deleteUser(id)
    if (authErr) {
      console.error('auth delete error:', authErr)
      return NextResponse.json({ error: 'Failed to delete auth user' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
