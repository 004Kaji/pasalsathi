// POST /api/staff/customers — staff can add a new khata customer at the counter.
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db/supabase'
import { getStaffContext } from '@/lib/staff-auth'

export async function POST(req: NextRequest) {
  const staff = await getStaffContext()
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, phone, address } = await req.json() as {
    name: string; phone?: string; address?: string
  }
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('customers').insert({
    business_id: staff.businessId,
    name:        name.trim(),
    phone:       phone?.trim() || null,
    address:     address?.trim() || null,
    balance:     0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ customer: data })
}
