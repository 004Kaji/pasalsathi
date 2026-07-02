import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerClient } from '@/lib/db/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, pin } = await req.json() as { name: string; pin: string }
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 })

  const { data: business } = await supabase.from('businesses').select('id').eq('owner_id', user.id).single()
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const pin_hash = await bcrypt.hash(pin, 10)

  const { error } = await supabase.from('staff').insert({
    business_id: business.id,
    name: name.trim(),
    pin_hash,
    active: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
