'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, MessageSquare, TrendingUp, TrendingDown, Phone, MapPin, FileText } from 'lucide-react'
import { formatBSFull } from '@/lib/bs-date'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Customer, KhataEntry } from '@/types/database'

type EntryType = 'credit' | 'payment'

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [entries, setEntries] = useState<KhataEntry[]>([])
  const [businessId, setBusinessId] = useState('')
  const [loading, setLoading] = useState(true)

  // Add entry form
  const [showForm, setShowForm] = useState(false)
  const [entryType, setEntryType] = useState<EntryType>('credit')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // SMS
  const [smsLoading, setSmsLoading] = useState(false)
  const [smsMsg, setSmsMsg] = useState('')

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
      supabase.from('customers').select('*').eq('id', id).single(),
      supabase
        .from('khata_entries')
        .select('*')
        .eq('customer_id', id)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false }),
    ])

    setCustomer(cust as Customer)
    setEntries((ents as KhataEntry[]) ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleAddEntry() {
    setFormError('')
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setFormError('सही रकम हाल्नुहोस्'); return }

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Insert entry
    const { error } = await supabase.from('khata_entries').insert({
      business_id: businessId,
      customer_id: id,
      type: entryType,
      amount: amt,
      description: description.trim() || null,
      created_by: user.id,
    })

    if (error) { setFormError('राख्न समस्या भयो'); setSaving(false); return }

    // Update customer totals
    const field = entryType === 'credit' ? 'total_credit' : 'total_paid'
    const current = entryType === 'credit'
      ? Number(customer?.total_credit ?? 0)
      : Number(customer?.total_paid ?? 0)

    await supabase
      .from('customers')
      .update({ [field]: current + amt })
      .eq('id', id)

    // Auto-create Hisab transaction when collecting payment
    if (entryType === 'payment') {
      await supabase.from('transactions').insert({
        business_id: businessId,
        type: 'in',
        amount: amt,
        discount_percent: 0,
        category: 'sales',
        description: `खाता संकलन — ${customer?.name ?? ''}${description.trim() ? ': ' + description.trim() : ''}`,
        payment_method: 'cash',
        transaction_date: new Date().toISOString().split('T')[0],
        created_by: user.id,
      })
    }

    // Reset form and refresh
    setAmount('')
    setDescription('')
    setShowForm(false)
    setSaving(false)
    await fetchData()
  }

  async function sendReminder() {
    if (!customer?.phone) return
    const outstanding = Number(customer.total_credit) - Number(customer.total_paid)
    if (outstanding <= 0) return

    setSmsLoading(true)
    setSmsMsg('')
    const message = `नमस्ते ${customer.name} जी, तपाईंको NPR ${outstanding.toLocaleString()} बाँकी छ। कृपया भुक्तान गर्नुहोस् - PasalSathi`

    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: customer.phone, message, businessId, customerId: id }),
    })
    const data = await res.json() as { error?: string }
    setSmsMsg(res.ok ? '✓ SMS पठाइयो' : (data.error ?? 'SMS पठाउन सकिएन'))
    setSmsLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-lg">लोड हुँदैछ...</div>
  if (!customer) return <div className="flex items-center justify-center min-h-screen text-red-500 text-lg">ग्राहक भेटिएन</div>

  const outstanding = Math.max(0, Number(customer.total_credit) - Number(customer.total_paid))
  const isClean = outstanding === 0

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className={`px-4 pt-5 pb-6 ${isClean ? 'bg-green-600' : 'bg-amber-600'}`}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white truncate">{customer.name}</h1>
        </div>

        {/* Customer info */}
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
          {customer.notes && (
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <FileText size={15} /> <span>{customer.notes}</span>
            </div>
          )}
        </div>

        {/* Outstanding balance */}
        <div className="mt-4 text-center">
          <p className="text-white/80 text-sm font-medium">कुल बाँकी उधारो</p>
          <p className="text-white text-4xl font-bold mt-1">
            NPR {outstanding.toLocaleString('ne-NP')}
          </p>
          {isClean && <p className="text-white/80 text-sm mt-1">✓ सबै भुक्तान भयो</p>}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setEntryType('credit'); setShowForm(true) }}
            className="flex items-center justify-center gap-2 py-4 bg-red-600 text-white rounded-2xl font-bold text-base active:scale-[0.98] transition-transform"
          >
            <TrendingUp size={20} /> उधारो दिनुहोस्
          </button>
          <button
            onClick={() => { setEntryType('payment'); setShowForm(true) }}
            className="flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-2xl font-bold text-base active:scale-[0.98] transition-transform"
          >
            <TrendingDown size={20} /> भुक्तान लिनुहोस्
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
            {smsLoading ? 'पठाउँदैछ...' : 'SMS रिमाइन्डर पठाउनुहोस्'}
          </button>
        )}
        {smsMsg && (
          <p className={`text-center font-medium ${smsMsg.startsWith('✓') ? 'text-green-700' : 'text-red-600'}`}>
            {smsMsg}
          </p>
        )}

        {/* Add entry form */}
        {showForm && (
          <div className={`rounded-2xl p-5 border-2 shadow-sm ${entryType === 'credit' ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
            <h3 className={`text-lg font-bold mb-4 ${entryType === 'credit' ? 'text-red-700' : 'text-green-700'}`}>
              {entryType === 'credit' ? '🔴 उधारो दिएको रकम' : '🟢 भुक्तान लिएको रकम'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-base font-semibold text-gray-700 block mb-2">रकम (NPR) *</label>
                <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-gray-200">
                  <span className="text-xl font-bold text-gray-400">रु.</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 text-3xl font-bold text-gray-900 border-0 outline-none bg-transparent placeholder-gray-200"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[100, 500, 1000, 5000].map((q) => (
                    <button key={q} type="button" onClick={() => setAmount(String(q))}
                      className="flex-1 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-semibold text-sm active:scale-95">
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-base font-semibold text-gray-700 block mb-2">विवरण (वैकल्पिक)</label>
                <input
                  type="text"
                  placeholder="जस्तै: चामल उधारो, आंशिक भुक्तान..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-base border border-gray-200 rounded-xl px-4 h-12 outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                />
              </div>

              {formError && <p className="text-red-600 text-sm font-medium">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setAmount(''); setDescription(''); setFormError('') }}
                  className="flex-1 py-4 rounded-xl border-2 border-gray-300 text-gray-600 font-semibold text-base active:scale-[0.98]"
                >
                  रद्द
                </button>
                <button
                  type="button"
                  onClick={handleAddEntry}
                  disabled={saving || !amount}
                  className={`flex-1 py-4 rounded-xl text-white font-bold text-base active:scale-[0.98] disabled:opacity-50 ${entryType === 'credit' ? 'bg-red-600' : 'bg-green-600'}`}
                >
                  {saving ? 'राख्दैछ...' : '✓ राख्नुहोस्'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Entry history */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">कारोबारको इतिहास</h2>
          {entries.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-gray-500 text-base">अहिलेसम्म कुनै कारोबार छैन</p>
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

function EntryRow({ entry }: { entry: KhataEntry }) {
  const isCredit = entry.type === 'credit'
  return (
    <div className={`flex items-center justify-between rounded-xl p-4 border ${isCredit ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${isCredit ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
          {isCredit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {entry.description || (isCredit ? 'उधारो दिएको' : 'भुक्तान लिएको')}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatBSFull(new Date(entry.entry_date + 'T00:00:00'))}
            {entry.sms_sent && <span className="ml-2 text-blue-400">📱 SMS</span>}
          </p>
        </div>
      </div>
      <p className={`text-lg font-bold ${isCredit ? 'text-red-700' : 'text-green-700'}`}>
        {isCredit ? '+' : '-'} NPR {Number(entry.amount).toLocaleString('ne-NP')}
      </p>
    </div>
  )
}
