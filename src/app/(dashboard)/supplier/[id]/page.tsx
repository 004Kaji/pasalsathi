'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, TrendingDown, TrendingUp, Plus, Trash2, MessageSquare, ChevronRight,
} from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { formatBSFull } from '@/lib/bs-date'
import type { Supplier, SupplierEntry } from '@/types/database'

function formatNPR(n: number) {
  return `NPR ${Number(n).toLocaleString('ne-NP')}`
}

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [entries, setEntries] = useState<SupplierEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [entryType, setEntryType] = useState<'credit_taken' | 'payment_made'>('credit_taken')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [smsLoading, setSmsLoading] = useState(false)
  const [businessId, setBusinessId] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: biz } = await supabase
      .from('businesses').select('id').eq('owner_id', user.id).single()
    if (!biz) return
    setBusinessId(biz.id)

    const [{ data: sup }, { data: ents }] = await Promise.all([
      supabase.from('suppliers').select('*').eq('id', id).single(),
      supabase.from('supplier_entries').select('*')
        .eq('supplier_id', id).order('entry_date', { ascending: false }),
    ])

    setSupplier(sup as Supplier)
    setEntries((ents as SupplierEntry[]) ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const outstanding = supplier
    ? Math.max(0, Number(supplier.total_credit_taken) - Number(supplier.total_paid))
    : 0

  async function handleAddEntry() {
    if (!amount || isNaN(parseFloat(amount))) return
    setSaving(true)
    const supabase = createClient()
    const today = new Date()
    const bsDate = formatBSFull(today)

    const { error } = await supabase.from('supplier_entries').insert({
      business_id: businessId,
      supplier_id: id,
      type: entryType,
      amount: parseFloat(amount),
      description: description.trim() || null,
      due_date: dueDate || null,
      bs_date: bsDate,
      entry_date: today.toISOString().split('T')[0],
    })

    if (!error) {
      // Update supplier totals
      if (entryType === 'credit_taken') {
        await supabase.from('suppliers').update({
          total_credit_taken: Number(supplier!.total_credit_taken) + parseFloat(amount),
          updated_at: new Date().toISOString(),
        }).eq('id', id)
      } else {
        await supabase.from('suppliers').update({
          total_paid: Number(supplier!.total_paid) + parseFloat(amount),
          updated_at: new Date().toISOString(),
        }).eq('id', id)

        // Auto-create Hisab transaction when paying supplier
        await supabase.from('transactions').insert({
          business_id: businessId,
          type: 'out',
          amount: parseFloat(amount),
          discount_percent: 0,
          category: 'purchase',
          description: `सप्लायर भुक्तानी — ${supplier?.name ?? ''}${description.trim() ? ': ' + description.trim() : ''}`,
          payment_method: 'cash',
          transaction_date: today.toISOString().split('T')[0],
          created_by: null,
        })
      }
      setAmount('')
      setDescription('')
      setDueDate('')
      setShowAddForm(false)
      await fetchData()
    }
    setSaving(false)
  }

  async function handleDelete(entryId: string, entry: SupplierEntry) {
    const supabase = createClient()
    await supabase.from('supplier_entries').delete().eq('id', entryId)
    // Reverse totals
    if (entry.type === 'credit_taken') {
      await supabase.from('suppliers').update({
        total_credit_taken: Math.max(0, Number(supplier!.total_credit_taken) - Number(entry.amount)),
      }).eq('id', id)
    } else {
      await supabase.from('suppliers').update({
        total_paid: Math.max(0, Number(supplier!.total_paid) - Number(entry.amount)),
      }).eq('id', id)
    }
    await fetchData()
  }

  async function handleSendSMS() {
    if (!supplier?.phone) return
    setSmsLoading(true)
    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: supplier.phone,
        message: `नमस्ते ${supplier.name} जी, हामीले NPR ${outstanding.toLocaleString()} तिर्न बाँकी छ। — PasalSathi`,
        type: 'supplier_reminder',
        business_id: businessId,
      }),
    })
    setSmsLoading(false)
    if (res.ok) alert('SMS पठाइयो!')
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-orange-500/50 text-base"

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-500">लोड हुँदैछ...</div>
  )

  if (!supplier) return (
    <div className="flex items-center justify-center py-20 text-gray-500">सप्लायर भेटिएन</div>
  )

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 z-10 px-4 pt-5 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/10 text-gray-400">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{supplier.name}</h1>
          {supplier.phone && <p className="text-sm text-gray-500">📱 +977 {supplier.phone}</p>}
        </div>
        <button
          onClick={() => setShowAddForm(f => !f)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
        >
          <Plus size={18} /> थप्नुहोस्
        </button>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Balance card */}
        <div className={`rounded-2xl p-5 border ${
          outstanding === 0
            ? 'bg-green-500/10 border-green-500/20'
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <p className={`text-sm font-medium mb-1 ${outstanding === 0 ? 'text-green-400' : 'text-red-400'}`}>
            {outstanding === 0 ? '✅ सबै भुक्तानी भइसक्यो' : '⚠️ तिर्न बाँकी रकम'}
          </p>
          <p className={`text-4xl font-bold ${outstanding === 0 ? 'text-green-300' : 'text-red-300'}`}>
            {formatNPR(outstanding)}
          </p>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="text-gray-500">लिएको: <span className="text-white font-semibold">{formatNPR(Number(supplier.total_credit_taken))}</span></span>
            <span className="text-gray-500">तिरेको: <span className="text-green-400 font-semibold">{formatNPR(Number(supplier.total_paid))}</span></span>
          </div>
        </div>

        {/* SMS button */}
        {supplier.phone && outstanding > 0 && (
          <button
            onClick={handleSendSMS}
            disabled={smsLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 py-3 rounded-2xl font-semibold active:scale-95 transition-transform disabled:opacity-50"
          >
            <MessageSquare size={18} />
            {smsLoading ? 'पठाउँदैछ...' : 'SMS पठाउनुहोस्'}
          </button>
        )}

        {/* Add entry form */}
        {showAddForm && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
            <p className="font-semibold text-white">नयाँ प्रविष्टि</p>

            {/* Type toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setEntryType('credit_taken')}
                className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                  entryType === 'credit_taken'
                    ? 'bg-red-500/30 border border-red-500/50 text-red-300'
                    : 'bg-white/5 border border-white/10 text-gray-500'
                }`}
              >
                📦 माल लिएको
              </button>
              <button
                onClick={() => setEntryType('payment_made')}
                className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                  entryType === 'payment_made'
                    ? 'bg-green-500/30 border border-green-500/50 text-green-300'
                    : 'bg-white/5 border border-white/10 text-gray-500'
                }`}
              >
                ✅ भुक्तानी गरेको
              </button>
            </div>

            <input
              type="number"
              placeholder="रकम (NPR)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={inputClass}
            />
            <input
              type="text"
              placeholder="विवरण (वैकल्पिक)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={inputClass}
            />
            {entryType === 'credit_taken' && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">भुक्तानी म्याद (वैकल्पिक)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-semibold"
              >
                रद्द
              </button>
              <button
                onClick={handleAddEntry}
                disabled={saving || !amount}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold active:scale-95 transition-transform disabled:opacity-50"
              >
                {saving ? 'सुरक्षित...' : 'सुरक्षित गर्नुहोस्'}
              </button>
            </div>
          </div>
        )}

        {/* Entry list */}
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-3">📋 कारोबार इतिहास</p>
          {entries.length === 0 ? (
            <div className="text-center py-10 text-gray-600">कुनै कारोबार छैन</div>
          ) : (
            <div className="space-y-2">
              {entries.map(entry => (
                <div
                  key={entry.id}
                  className={`rounded-2xl border p-4 flex items-start justify-between ${
                    entry.type === 'credit_taken'
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-green-500/10 border-green-500/20'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`rounded-xl p-2.5 shrink-0 ${
                      entry.type === 'credit_taken' ? 'bg-red-500/20' : 'bg-green-500/20'
                    }`}>
                      {entry.type === 'credit_taken'
                        ? <TrendingDown size={18} className="text-red-400" />
                        : <TrendingUp size={18} className="text-green-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {entry.type === 'credit_taken' ? '📦 माल लिएको' : '✅ भुक्तानी गरेको'}
                      </p>
                      {entry.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{entry.description}</p>
                      )}
                      <p className="text-xs text-gray-600 mt-0.5">{entry.bs_date}</p>
                      {entry.due_date && (
                        <p className="text-xs text-amber-500 mt-0.5">📅 म्याद: {entry.due_date}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <p className={`text-lg font-bold ${
                      entry.type === 'credit_taken' ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {entry.type === 'credit_taken' ? '-' : '+'}{formatNPR(Number(entry.amount))}
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger className="p-2 rounded-lg bg-white/5 text-gray-600 hover:bg-red-500/20 hover:text-red-400 active:scale-95 transition-all">
                        <Trash2 size={15} />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>हटाउने?</AlertDialogTitle>
                          <AlertDialogDescription>
                            यो प्रविष्टि हटाइनेछ। यो काम उल्टाउन सकिँदैन।
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>रद्द</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(entry.id, entry)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            हटाउनुहोस्
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
