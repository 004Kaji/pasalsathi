import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db/supabase'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json() as { email: string; password: string }

  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: 'इमेल र कम्तीमा ६ अक्षरको पासवर्ड चाहिन्छ' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Check if user already exists
  const { data: userPage } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const existing = userPage?.users?.find(u => u.email === email)

  if (existing) {
    return NextResponse.json({ error: 'यो इमेलबाट पहिले नै खाता बनाइएको छ। लगइन गर्नुहोस्।' }, { status: 409 })
  }

  // Create user directly — bypasses email confirmation
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !created.user) {
    return NextResponse.json({ error: 'खाता बनाउन समस्या भयो। फेरि प्रयास गर्नुहोस्।' }, { status: 500 })
  }

  // Generate a magic link so the client can establish a session
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError || !linkData.properties?.hashed_token) {
    return NextResponse.json({ error: 'लगइन गर्न समस्या भयो। फेरि प्रयास गर्नुहोस्।' }, { status: 500 })
  }

  return NextResponse.json({ hashed_token: linkData.properties.hashed_token })
}
