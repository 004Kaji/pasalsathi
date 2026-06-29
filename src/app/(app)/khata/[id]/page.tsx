'use client'
/**
 * khata/[id]/page.tsx
 * Customer detail page — shows balance and khata entry history.
 * Columns match 004_clean_schema.sql:
 *   customers: id, name, phone, address, balance
 *   khata_entries: id, customer_id, type, amount, created_at
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/db/supabase'
import { ArrowLeft, MessageSquare, TrendingUp, TrendingDown, Phone, MapPin } from 'lucide-react'
import { formatBSFull } from '@/lib/utils/date'
import type { Customer, KhataEntry } from '@/lib/types/database'

type EntryType = 'credit' | 'payment'

const QUICK_AMOUNTS = [100, 500, 1000, 5000] as const

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string

  const [customer,   setCustomer]   = useState<Customer | null>(null)
  const [entries,    setEntries]    = useState<KhataEntry[]>([])
  const [businessId, setBusinessId] = useState('')
  const [loading,    setLoading]    = useState(true)

  const [showForm,      setShowForm]      = useState(false)
  const [entryType,     setEntryType]     = useState<EntryType>('credit')
  const [amount,        setAmount]        = useState('')
  const [collectMethod, setCollectMethod] = useState<'cash' | 'esewa' | 'khalti'>('cash')
  const [saving,        setSaving]        = useState(false)
  const [formError,     setFormError]     = useState('')

  const [smsLoading, setSmsLoading] = useState(false)
  const [smsMsg,     setSmsMsg]     = useState('')

  /** Load customer info and their khata entry history */
  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: biz } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()
    if (!biz) return
    setBusinessId(biz.id)

    const [{ data: cust }, { data: ents }] = await Promise.all([
      supabase.from('customers').select('*').eq('id', customerId).single(),
      supabase
        .from('khata_entries')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false }),
    ])

    setCustomer(cust as Customer)
    setEntries((ents as KhataEntry[]) ?? [])
    setLoading(false)
  }, [customerId])

  useEffect(() => { fetchData() }, [fetchData])

  /**
   * Insert a khata entry and update customer balance.
   * credit → balance increases (more is owed)
   * payment → balance decreases (debt is reduced)
   */
  async function handleAddEntry() {
    setFormError('')
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setFormError('Enter a valid amount'); return }

    setSaving(true)
    const supabase = createClient()

    const { error: entryErr } = await supabase.from('khata_entries').insert({
      business_id: businessId,
      customer_id: customerId,
      type:        entryType,
      amount:      amt,
    })

    if (entryErr) { setFormError('Error saving entry'); setSaving(false); return }

    const balanceDelta = entryType === 'credit' ? amt : -amt
    const newBalance   = Math.max(0, Number(customer?.balance ?? 0) + balanceDelta)
    await supabase.from('customers').update({ balance: newBalance }).eq('id', customerId)

    if (entryType === 'payment') {
      await supabase.from('transactions').insert({
        business_id:    businessId,
        type:           'income',
        amount:         amt,
        item_name:      `Khata payment — ${customer?.name ?? ''}`,
        payment_method: collectMethod,
      })
    }

    setAmount('')
    setShowForm(false)
    setSaving(false)
    await fetchData()
  }

  /** Send an SMS reminder to the customer about their outstanding balance */
  async function sendReminder() {
    if (!customer?.phone) return
    const outstanding = Number(customer.balance)
    if (outstanding <= 0) return

    setSmsLoading(true)
    setSmsMsg('')
    const message = `Hello ${customer.name}, you have NPR ${outstanding.toLocaleString()} outstanding. Please make payment — PasalSathi`

    const res  = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: customer.phone, message, businessId, customerId }),
    })
    const data = await res.json() as { error?: string }
    setSmsMsg(res.ok ? '✓ SMS sent' : (data.error ?? 'Failed to send SMS'))
    setSmsLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-lg">Loading...</div>
  if (!customer) return <div className="flex items-center justify-center min-h-screen text-red-500 text-lg">Customer not found</div>

  const outstanding = Math.max(0, Number(customer.balance))
  const isClean     = outstanding === 0

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      {/* Header */}
      <div className={`px-4 pt-5 pb-6 ${isClean ? 'bg-green-600' : 'bg-amber-600'}`}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white truncate">{customer.name}</h1>
        </div>

        {/* Customer contact info */}
        <div className="bg-white/15 rounded-2xl p-4 space-y-1.5">
          {customer.phone && (
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <Phone size={15} /> <span>{customer.phone}</span>
            </div>
          )}
          {customer.address && (
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <MapPin size={15} /> <span>{customer.address}</span>
            </div>
          )}
        </div>

        {/* Outstanding balance */}
        <div className="mt-4 text-center">
          <p className="text-white/80 text-sm font-medium">Total Outstanding</p>
          <p className="text-white text-4xl font-bold mt-1">
            NPR {outstanding.toLocaleString('ne-NP')}
          </p>
          {isClean && <p className="text-white/80 text-sm mt-1">✓ All paid up</p>}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setEntryType('credit'); setShowForm(true) }}
            className="flex items-center justify-center gap-2 py-4 bg-red-600 text-white rounded-2xl font-bold text-base active:scale-[0.98] transition-transform"
          >
            <TrendingUp size={20} /> Give Credit
          </button>
          <button
            onClick={() => { setEntryType('payment'); setShowForm(true) }}
            className="flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-2xl font-bold text-base active:scale-[0.98] transition-transform"
          >
            <TrendingDown size={20} /> Collect Payment
          </button>
        </div>

        {/* SMS button */}
        {customer.phone && outstanding > 0 && (
          <button
            onClick={sendReminder}
            disabled={smsLoading}
            className="w-full flex items-center justify-center gap-2 py-4 bg-white border-2 border-amber-400 text-amber-700 rounded-2xl font-semibold text-base active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <MessageSquare size={20} />
            {smsLoading ? 'Sending...' : 'Send SMS Reminder'}
          </button>
        )}
        {smsMsg && (
          <p className={`text-center font-medium ${smsMsg.startsWith('✓') ? 'text-green-700' : 'text-red-600'}`}>
            {smsMsg}
          </p>
        )}

        {/* Inline add-entry form */}
        {showForm && (
          <div className={`rounded-2xl p-5 border ${entryType === 'credit' ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
            <h3 className={`text-lg font-bold mb-4 ${entryType === 'credit' ? 'text-red-400' : 'text-green-400'}`}>
              {entryType === 'credit' ? '🔴 Credit Amount' : '🟢 Payment Amount'}
            </h3>

            <label className="text-sm font-semibold text-gray-400 block mb-2">Amount (NPR) *</label>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-2">
              <span className="text-xl font-bold text-gray-600">Rs.</span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="flex-1 text-3xl font-bold text-white border-0 outline-none bg-transparent placeholder:text-gray-700"
              />
            </div>
            <div className="flex gap-2 mb-4">
              {QUICK_AMOUNTS.map(q => (
                <button key={q} type="button" onClick={() => setAmount(String(q))}
                  className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 font-semibold text-sm active:scale-95">
                  {q}
                </button>
              ))}
            </div>

            {/* Payment method selector — only for collect payment */}
            {entryType === 'payment' && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Payment received via</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'esewa', 'khalti'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCollectMethod(m)}
                      className={`py-2.5 rounded-xl text-sm font-bold capitalize border transition-all ${
                        collectMethod === m
                          ? 'bg-green-600 border-green-500 text-white'
                          : 'bg-white/5 border-white/10 text-gray-400'
                      }`}
                    >
                      {m === 'cash' ? '💵' : m === 'esewa' ? '🟢' : '🟣'} {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formError && <p className="text-red-400 text-sm font-medium mb-3">{formError}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setAmount(''); setFormError('') }}
                className="flex-1 py-4 rounded-xl border border-white/10 text-gray-400 font-semibold text-base active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddEntry}
                disabled={saving || !amount}
                className={`flex-1 py-4 rounded-xl text-white font-bold text-base active:scale-[0.98] disabled:opacity-50 ${entryType === 'credit' ? 'bg-red-600' : 'bg-green-600'}`}
              >
                {saving ? 'Saving...' : '✓ Save'}
              </button>
            </div>
          </div>
        )}

        {/* Entry history */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3">Transaction History</h2>
          {entries.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-gray-500 text-base">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <EntryRow key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Single khata entry row with type icon and formatted date */
function EntryRow({ entry }: { entry: KhataEntry }) {
  const isCredit = entry.type === 'credit'
  return (
    <div className={`flex items-center justify-between rounded-xl p-4 border ${isCredit ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${isCredit ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
          {isCredit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {isCredit ? 'Credit given' : 'Payment collected'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatBSFull(new Date(entry.created_at))}
          </p>
        </div>
      </div>
      <p className={`text-lg font-bold ${isCredit ? 'text-red-400' : 'text-green-400'}`}>
        {isCredit ? '+' : '-'} NPR {Number(entry.amount).toLocaleString('ne-NP')}
      </p>
    </div>
  )
}
