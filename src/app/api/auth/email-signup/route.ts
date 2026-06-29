import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db/supabase'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json() as { email: string; password: string }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  if (!/\d/.test(password)) {
    return NextResponse.json({ error: 'Password must contain at least 1 number' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Check if user already exists (listUsers paginates — fine for typical scale)
  const { data: userPage } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const existing = userPage?.users?.find(u => u.email === email)

  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 409 })
  }

  // Create user directly — bypasses email confirmation
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !created.user) {
    return NextResponse.json({ error: 'Could not create account. Please try again.' }, { status: 500 })
  }

  // Generate a magic link so the client can establish a session immediately
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError || !linkData.properties?.hashed_token) {
    return NextResponse.json({ error: 'Account created but login failed. Please sign in.' }, { status: 500 })
  }

  return NextResponse.json({ hashed_token: linkData.properties.hashed_token })
}
