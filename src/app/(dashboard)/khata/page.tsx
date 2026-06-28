'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, MessageSquare, ChevronRight, Users } from 'lucide-react'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import type { Customer, Plan } from '@/types/database'

function getBalanceColor(outstanding: number) {
  if (outstanding === 0) return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', badge: 'bg-gray-100 text-gray-600' }
  if (outstanding < 5000) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' }
  if (outstanding < 20000) return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' }
  return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' }
}

export default function KhataPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState('')
  const [plan, setPlan] = useState<Plan>('sano')
  const [smsLoading, setSmsLoading] = useState<string | null>(null)
  const [smsMsg, setSmsMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: biz } = await supabase
      .from('businesses')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single()

    if (!biz) return
    setBusinessId(biz.id)
    setPlan(biz.plan as Plan)

    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', biz.id)
      .order('updated_at', { ascending: false })

    setCustomers((data as Customer[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search)
  )

  const totalOutstanding = customers.reduce(
    (sum, c) => sum + Math.max(0, Number(c.total_credit) - Number(c.total_paid)), 0
  )

  const limit = PLAN_LIMITS[plan].customers
  const atLimit = limit !== Infinity && customers.length >= limit

  async function sendReminder(customer: Customer) {
    const outstanding = Number(customer.total_credit) - Number(customer.total_paid)
    if (!customer.phone || outstanding <= 0) return

    setSmsLoading(customer.id)
    setSmsMsg(null)

    const message = `Hello ${customer.name}, you have NPR ${outstanding.toLocaleString()} outstanding. Please make payment - PasalSathi`

    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: customer.phone,
        message,
        businessId,
        customerId: customer.id,
      }),
    })
    const data = await res.json() as { error?: string }
    setSmsMsg({
      id: customer.id,
      text: res.ok ? 'SMS sent ✓' : (data.error ?? 'Failed to send SMS'),
      ok: res.ok,
    })
    setSmsLoading(null)
    setTimeout(() => setSmsMsg(null), 3000)
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-5 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Khata Book</h1>
          {atLimit ? (
            <div className="text-xs text-red-600 font-medium bg-red-50 px-3 py-1.5 rounded-lg">
              Limit Reached ({limit})
            </div>
          ) : (
            <Link
              href="/khata/new"
              className="flex items-center gap-1.5 bg-orange-600 text-white px-4 py-2.5 rounded-xl font-semibold text-base active:scale-95 transition-transform"
            >
              <Plus size={20} /> Add
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl text-base outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Total outstanding banner */}
        <div className="bg-amber-600 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-amber-100 text-sm font-medium">Total Outstanding Credit</p>
            <p className="text-white text-3xl font-bold mt-1">
              NPR {totalOutstanding.toLocaleString('ne-NP')}
            </p>
          </div>
          <div className="bg-amber-500 rounded-xl p-3">
            <Users size={28} className="text-white" />
          </div>
        </div>

        {/* Plan usage */}
        {limit !== Infinity && (
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-sm text-gray-600">Customers: <strong>{customers.length}</strong> / {limit}</span>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${customers.length / limit > 0.8 ? 'bg-red-500' : 'bg-orange-500'}`}
                style={{ width: `${Math.min(100, (customers.length / limit) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Customer list */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-lg">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📒</p>
            <p className="text-xl font-semibold text-gray-500">
              {search ? 'No one found' : 'No customers yet'}
            </p>
            {!search && <p className="text-base text-gray-400 mt-2">Tap "+ Add" above</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((customer) => {
              const outstanding = Math.max(0, Number(customer.total_credit) - Number(customer.total_paid))
              const colors = getBalanceColor(outstanding)
              const isSending = smsLoading === customer.id
              const msg = smsMsg?.id === customer.id ? smsMsg : null

              return (
                <div key={customer.id} className={`rounded-2xl border ${colors.border} ${colors.bg} overflow-hidden`}>
                  <Link href={`/khata/${customer.id}`} className="flex items-center justify-between p-4 active:opacity-80">
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold text-gray-900 truncate">{customer.name}</p>
                      {customer.phone && (
                        <p className="text-sm text-gray-500 mt-0.5">📱 {customer.phone}</p>
                      )}
                      {customer.address && (
                        <p className="text-sm text-gray-400 truncate">📍 {customer.address}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <div className="text-right">
                        <span className={`text-lg font-bold block ${colors.text}`}>
                          NPR {outstanding.toLocaleString('ne-NP')}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                          {outstanding === 0 ? 'Clear ✓' : 'Outstanding'}
                        </span>
                      </div>
                      <ChevronRight size={18} className="text-gray-400" />
                    </div>
                  </Link>

                  {/* SMS reminder button — only if has phone and outstanding > 0 */}
                  {customer.phone && outstanding > 0 && (
                    <div className="border-t border-current border-opacity-10 px-4 py-3">
                      {msg ? (
                        <p className={`text-sm font-medium text-center ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>
                          {msg.text}
                        </p>
                      ) : (
                        <button
                          onClick={() => sendReminder(customer)}
                          disabled={isSending}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          <MessageSquare size={16} className="text-green-600" />
                          {isSending ? 'Sending...' : `Send SMS Reminder`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
