/**
 * POST /api/sms/send
 * Sends an SMS message via Sparrow SMS.
 * The simplified schema has no plan limits or sms_logs table,
 * so this route just validates and fires the SMS directly.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as {
    phone: string
    message: string
    businessId: string
  }

  const { phone, message, businessId } = body

  if (!phone || !message || !businessId) {
    return NextResponse.json({ error: 'अमान्य अनुरोध' }, { status: 400 })
  }

  // Confirm the business belongs to the requesting user
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('owner_id', user.id)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // Send via Sparrow SMS — fall back to dev-mode console log if token is missing
  const sparrowToken = process.env.SPARROW_SMS_TOKEN

  if (!sparrowToken) {
    return NextResponse.json({ success: true, dev: true })
  }

  try {
    const sparrowResponse = await fetch('http://api.sparrowsms.com/v2/sms/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: sparrowToken,
        from:  'PasalSathi',
        to:    phone.replace('+977', '').replace(/\D/g, ''),
        text:  message,
      }),
    })

    if (!sparrowResponse.ok) {
      return NextResponse.json({ error: 'SMS पठाउन समस्या भयो' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'SMS पठाउन समस्या भयो' }, { status: 500 })
  }
}
