import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { staffId } = await req.json() as { staffId: string }

  const { data: business } = await supabase.from('businesses').select('id').eq('owner_id', user.id).single()
  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Deactivate instead of delete to keep history
  const { error } = await supabase.from('staff').update({ active: false })
    .eq('id', staffId).eq('business_id', business.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
