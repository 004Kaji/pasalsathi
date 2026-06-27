import { NextRequest, NextResponse } from 'next/server'

// Supabase calls this when it needs to send a phone OTP.
// Configure in: Supabase Dashboard → Authentication → Hooks → Send SMS Hook
// Hook URL: https://yourdomain.com/api/auth/sms-hook
// Set SUPABASE_HOOK_SECRET in both .env.local and Supabase hook config.

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.SUPABASE_HOOK_SECRET

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as {
    user: { phone: string }
    sms: { otp: string }
  }

  const { user, sms } = body
  const phone = user.phone.replace('+977', '')
  const message = `PasalSathi: तपाईंको OTP कोड ${sms.otp} हो। १० मिनटमा म्याद सकिन्छ।`

  const sparrowRes = await fetch('http://api.sparrowsms.com/v2/sms/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: process.env.SPARROW_SMS_TOKEN,
      from: 'PasalSathi',
      to: phone,
      text: message,
    }),
  })

  if (!sparrowRes.ok) {
    console.error('Sparrow SMS failed:', await sparrowRes.text())
    return NextResponse.json({ error: 'SMS failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
