// Server-only helper: validates the ps_staff cookie and returns the staff context.
// Staff are not Supabase auth users — they authenticate via PIN and carry a
// staffId|businessId cookie. Every staff API route must call this first.
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/db/supabase'

export interface StaffContext {
  staffId: string
  staffName: string
  businessId: string
}

export async function getStaffContext(): Promise<StaffContext | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get('ps_staff')?.value
  if (!raw) return null

  const [staffId, businessId] = raw.split('|')
  if (!staffId || !businessId) return null

  const admin = createAdminClient()
  const { data: staff } = await admin
    .from('staff')
    .select('id, name, business_id, active')
    .eq('id', staffId)
    .eq('business_id', businessId)
    .eq('active', true)
    .single()

  if (!staff) return null
  return { staffId: staff.id, staffName: staff.name, businessId: staff.business_id }
}
