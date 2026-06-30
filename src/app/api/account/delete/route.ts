import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase-server'
import { createAdminClient } from '@/lib/db/supabase'

export async function DELETE() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: business } = await supabase
    .from('businesses').select('id').eq('owner_id', user.id).single()

  // Delete all business data first (RLS allows owner to delete their own)
  if (business) {
    await Promise.all([
      supabase.from('transactions').delete().eq('business_id', business.id),
      supabase.from('khata_entries').delete().eq('business_id', business.id),
      supabase.from('customers').delete().eq('business_id', business.id),
      supabase.from('products').delete().eq('business_id', business.id),
    ])
    await supabase.from('businesses').delete().eq('id', business.id)
  }

  // Delete auth user via admin client (requires service role)
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
