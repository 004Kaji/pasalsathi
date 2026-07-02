// GET /api/staff/data — everything a staff member needs to run the POS + khata:
// business info, product list, customer list. Validated by the ps_staff cookie.
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db/supabase'
import { getStaffContext } from '@/lib/staff-auth'

export async function GET() {
  const staff = await getStaffContext()
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const [{ data: business }, { data: products }, { data: customers }] = await Promise.all([
    admin.from('businesses').select('id, name, vat_number').eq('id', staff.businessId).single(),
    admin.from('products').select('*').eq('business_id', staff.businessId).order('name'),
    admin.from('customers').select('*').eq('business_id', staff.businessId).order('name'),
  ])

  return NextResponse.json({
    staffName:  staff.staffName,
    businessId: staff.businessId,
    bizName:    business?.name ?? '',
    vatNumber:  business?.vat_number ?? '',
    products:   products ?? [],
    customers:  customers ?? [],
  })
}
