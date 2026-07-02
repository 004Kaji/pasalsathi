// Staff khata access — append-only from the staff member's point of view:
// GET  ?customerId=X → customer + entry history + purchase history
// POST → add a credit or payment entry (stamped via the payment transaction).
// No edit, delete, or SMS — those stay owner-only.
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db/supabase'
import { getStaffContext } from '@/lib/staff-auth'

export async function GET(req: NextRequest) {
  const staff = await getStaffContext()
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const customerId = req.nextUrl.searchParams.get('customerId')
  if (!customerId) return NextResponse.json({ error: 'customerId required' }, { status: 400 })

  const admin = createAdminClient()
  const { data: customer } = await admin
    .from('customers').select('*')
    .eq('id', customerId).eq('business_id', staff.businessId).single()
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

  const [{ data: entries }, { data: purchases }] = await Promise.all([
    admin.from('khata_entries').select('*')
      .eq('customer_id', customerId).order('created_at', { ascending: false }),
    admin.from('transactions').select('id, item_name, amount, payment_method, created_at')
      .eq('customer_id', customerId).eq('type', 'income')
      .order('created_at', { ascending: false }).limit(20),
  ])

  return NextResponse.json({ customer, entries: entries ?? [], purchases: purchases ?? [] })
}

export async function POST(req: NextRequest) {
  const staff = await getStaffContext()
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { customerId, type, amount, collectMethod } = await req.json() as {
    customerId: string
    type: 'credit' | 'payment'
    amount: number
    collectMethod?: 'cash' | 'esewa' | 'khalti'
  }

  if (!customerId || !amount || amount <= 0 || !['credit', 'payment'].includes(type)) {
    return NextResponse.json({ error: 'Invalid entry' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: customer } = await admin
    .from('customers').select('id, name, balance')
    .eq('id', customerId).eq('business_id', staff.businessId).single()
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

  const { error: entryErr } = await admin.from('khata_entries').insert({
    business_id: staff.businessId,
    customer_id: customerId,
    type,
    amount,
  })
  if (entryErr) return NextResponse.json({ error: entryErr.message }, { status: 500 })

  const balanceDelta = type === 'credit' ? amount : -amount
  const newBalance   = Math.max(0, Number(customer.balance) + balanceDelta)
  await admin.from('customers').update({ balance: newBalance }).eq('id', customerId)

  // A collected payment is money in the drawer — record it stamped with the staff name
  if (type === 'payment') {
    await admin.from('transactions').insert({
      business_id:    staff.businessId,
      type:           'income',
      amount,
      item_name:      `Khata payment — ${customer.name} · by ${staff.staffName}`,
      payment_method: collectMethod ?? 'cash',
    })
  }

  return NextResponse.json({ ok: true })
}
