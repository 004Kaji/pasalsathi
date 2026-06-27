import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizePhone, isValidNepaliPhone } from '@/lib/phone'

export async function POST(request: NextRequest) {
  const { phone, otp } = await request.json() as { phone: string; otp: string }

  if (!phone || !isValidNepaliPhone(phone) || !otp) {
    return NextResponse.json({ error: 'अमान्य अनुरोध' }, { status: 400 })
  }

  const normalized = normalizePhone(phone)
  const supabase = createAdminClient()

  // Find a valid, unused OTP
  const { data: record } = await supabase
    .from('phone_otps')
    .select('id, otp, expires_at')
    .eq('phone', normalized)
    .eq('otp', otp)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!record) {
    return NextResponse.json(
      { error: 'OTP गलत छ वा म्याद सकियो। फेरि पठाउनुहोस्।' },
      { status: 400 }
    )
  }

  // Build a stable internal email from the phone number
  const internalEmail = `${normalized.replace('+', '')}@pasalsathi.net`

  // Find existing user by email — listUsers has no filter param in v2, so paginate and find
  const { data: userPage } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const existing = userPage?.users?.find(u => u.email === internalEmail)

  let userId: string

  if (existing) {
    userId = existing.id
  } else {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: internalEmail,
      email_confirm: true,
      phone: normalized,
      phone_confirm: true,
      user_metadata: { phone: normalized },
    })

    if (createError || !newUser.user) {
      return NextResponse.json({ error: 'खाता बनाउन समस्या भयो' }, { status: 500 })
    }

    userId = newUser.user.id
  }

  // Generate a magic link → extract hashed_token for client-side session
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: internalEmail,
  })

  if (linkError || !linkData.properties?.hashed_token) {
    return NextResponse.json({ error: 'लगइन गर्न समस्या भयो' }, { status: 500 })
  }

  // Mark OTP as used only after all operations succeed — prevents burning the OTP on a transient error
  await supabase.from('phone_otps').update({ used: true }).eq('id', record.id)

  return NextResponse.json({
    success: true,
    hashed_token: linkData.properties.hashed_token,
    user_id: userId,
  })
}
