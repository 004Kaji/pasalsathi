import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db/supabase'
import { normalizePhone, isValidNepaliPhone } from '@/lib/utils/phone'

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  const { phone } = await request.json() as { phone: string }

  if (!phone || !isValidNepaliPhone(phone)) {
    return NextResponse.json({ error: 'सही नेपाली नम्बर हाल्नुहोस्' }, { status: 400 })
  }

  const normalized = normalizePhone(phone)
  const otp = generateOtp()
  const supabase = createAdminClient()

  // Invalidate any existing unused OTPs for this phone
  await supabase
    .from('phone_otps')
    .update({ used: true })
    .eq('phone', normalized)
    .eq('used', false)

  // Store new OTP
  const { error: insertError } = await supabase
    .from('phone_otps')
    .insert({ phone: normalized, otp })

  if (insertError) {
    return NextResponse.json({ error: 'OTP बनाउन समस्या भयो' }, { status: 500 })
  }

  // Send via Sparrow SMS (local format: remove +977)
  const localPhone = normalized.replace('+977', '')
  const message = `PasalSathi: तपाईंको OTP कोड ${otp} हो। १० मिनटमा म्याद सकिन्छ।`

  const sparrowToken = process.env.SPARROW_SMS_TOKEN

  if (sparrowToken) {
    const smsRes = await fetch('https://api.sparrowsms.com/v2/sms/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: sparrowToken,
        from: 'PasalSathi',
        to: localPhone,
        text: message,
      }),
    })

    if (!smsRes.ok) {
      console.error('Sparrow SMS error:', await smsRes.text())
      return NextResponse.json({ error: 'SMS पठाउन समस्या भयो' }, { status: 500 })
    }
  } else {
    // Dev mode: no Sparrow token — OTP stored in DB, retrieve via Supabase dashboard
    void normalized
    void otp
  }

  return NextResponse.json({ success: true })
}
