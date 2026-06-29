import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { refCode } = await request.json() as { refCode: string }
  if (!refCode) return NextResponse.json({ error: 'No code' }, { status: 400 })

  // Get referee's business
  const { data: referee } = await supabase
    .from('businesses').select('id').eq('owner_id', user.id).single()
  if (!referee) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  // Find referrer by code
  const { data: referrer } = await supabase
    .from('businesses').select('id, months_earned').eq('referral_code', refCode.toUpperCase()).single()
  if (!referrer) return NextResponse.json({ error: 'Invalid code' }, { status: 404 })

  // Don't allow self-referral
  if (referrer.id === referee.id) return NextResponse.json({ ok: true })

  // Insert referral (UNIQUE on referee_id prevents duplicates)
  const { error } = await supabase.from('referrals').insert({
    referrer_id: referrer.id,
    referee_id:  referee.id,
  })
  if (error) return NextResponse.json({ ok: true }) // already claimed — ignore

  // Give referrer +1 month
  await supabase.from('businesses')
    .update({ months_earned: (referrer.months_earned ?? 0) + 1 })
    .eq('id', referrer.id)

  return NextResponse.json({ ok: true })
}
