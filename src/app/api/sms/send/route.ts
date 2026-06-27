import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import type { Plan } from '@/types/database'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { phone, message, businessId, customerId } = await request.json() as {
    phone: string
    message: string
    businessId: string
    customerId?: string
  }

  if (!phone || !message || !businessId) {
    return NextResponse.json({ error: 'अमान्य अनुरोध' }, { status: 400 })
  }

  // Get business plan
  const { data: business } = await supabase
    .from('businesses')
    .select('plan')
    .eq('id', businessId)
    .single()

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const plan = business.plan as Plan
  const smsLimit = PLAN_LIMITS[plan].sms_per_month

  // Count SMS sent this month
  if (smsLimit !== Infinity) {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('sms_logs')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('sent_at', startOfMonth.toISOString())

    if ((count ?? 0) >= smsLimit) {
      return NextResponse.json(
        { error: `यो महिनाको SMS सीमा (${smsLimit}) सकियो। Madhyam वा Thulo प्लानमा अपग्रेड गर्नुहोस्।` },
        { status: 429 }
      )
    }
  }

  // Send SMS via Sparrow
  const admin = createAdminClient()
  let smsStatus: 'sent' | 'failed' = 'failed'

  const sparrowToken = process.env.SPARROW_SMS_TOKEN
  if (sparrowToken) {
    try {
      const res = await fetch('http://api.sparrowsms.com/v2/sms/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: sparrowToken,
          from: 'PasalSathi',
          to: phone.replace('+977', '').replace(/\D/g, ''),
          text: message,
        }),
      })
      if (res.ok) smsStatus = 'sent'
    } catch {
      smsStatus = 'failed'
    }
  } else {
    // Dev mode — log to console
    console.log(`[DEV SMS] To: ${phone}\nMessage: ${message}`)
    smsStatus = 'sent'
  }

  // Log the SMS
  await admin.from('sms_logs').insert({
    business_id: businessId,
    phone,
    message,
    status: smsStatus,
  })

  // Mark SMS sent on khata_entries if customerId provided
  if (customerId && smsStatus === 'sent') {
    await admin
      .from('khata_entries')
      .update({ sms_sent: true, sms_sent_at: new Date().toISOString() })
      .eq('customer_id', customerId)
      .eq('sms_sent', false)
  }

  if (smsStatus === 'failed') {
    return NextResponse.json({ error: 'SMS पठाउन समस्या भयो' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
