// POST /api/staff/sale — staff checkout. Mirrors the owner's checkout flow but
// runs server-side with the admin client (staff have no Supabase session) and
// stamps the staff member's name on the transaction for owner accountability.
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db/supabase'
import { getStaffContext } from '@/lib/staff-auth'
import type { PaymentMethod } from '@/lib/types/database'

interface SaleBody {
  total: number
  itemSummary: string
  displayName?: string
  paymentMethod: PaymentMethod
  customerId?: string
  stockUpdates: { productId: string; qty: number }[]
}

export async function POST(req: NextRequest) {
  const staff = await getStaffContext()
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as SaleBody
  const { total, itemSummary, displayName, paymentMethod, customerId, stockUpdates } = body

  if (!total || total <= 0 || !itemSummary) {
    return NextResponse.json({ error: 'Invalid sale' }, { status: 400 })
  }
  if (paymentMethod === 'khata' && !customerId) {
    return NextResponse.json({ error: 'Khata sale needs a customer' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify the customer belongs to this staff member's business
  let customer: { id: string; balance: number } | null = null
  if (customerId) {
    const { data } = await admin
      .from('customers').select('id, balance')
      .eq('id', customerId).eq('business_id', staff.businessId).single()
    if (!data) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    customer = data
  }

  const label = displayName ? `${displayName} — ${itemSummary}` : itemSummary
  const { error: txErr } = await admin.from('transactions').insert({
    business_id:    staff.businessId,
    type:           'income',
    amount:         total,
    item_name:      `${label} · by ${staff.staffName}`,
    payment_method: paymentMethod,
    customer_id:    customerId ?? null,
  })
  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 })

  // Decrement stock only for products that belong to this business
  if (stockUpdates?.length) {
    const ids = stockUpdates.map(s => s.productId)
    const { data: owned } = await admin
      .from('products').select('id')
      .eq('business_id', staff.businessId).in('id', ids)
    const ownedIds = new Set((owned ?? []).map(p => p.id))
    await Promise.all(
      stockUpdates
        .filter(s => ownedIds.has(s.productId))
        .map(s => admin.rpc('decrement_stock', { product_id: s.productId, qty: s.qty }))
    )
  }

  if (paymentMethod === 'khata' && customer) {
    const { error: khErr } = await admin.from('khata_entries').insert({
      business_id: staff.businessId,
      customer_id: customer.id,
      type:        'credit',
      amount:      total,
    })
    if (khErr) return NextResponse.json({ error: khErr.message }, { status: 500 })

    await admin
      .from('customers')
      .update({ balance: Number(customer.balance) + total })
      .eq('id', customer.id)
  }

  return NextResponse.json({ ok: true })
}
