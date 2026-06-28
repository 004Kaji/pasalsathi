'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Transaction, TransactionCategory, PaymentMethod, TransactionType } from '@/types/database'

const CATEGORIES: { value: TransactionCategory; label: string; emoji: string }[] = [
  { value: 'sales',    label: 'Sales',    emoji: '💰' },
  { value: 'purchase', label: 'Purchase', emoji: '🛒' },
  { value: 'expense',  label: 'Expense',  emoji: '💸' },
  { value: 'salary',   label: 'Salary',   emoji: '👤' },
  { value: 'other',    label: 'Other',    emoji: '📦' },
]

const PAYMENT_METHODS: { value: PaymentMethod; label: string; emoji: string }[] = [
  { value: 'cash',    label: 'Cash',    emoji: '💵' },
  { value: 'bank',    label: 'Bank',    emoji: '🏦' },
  { value: 'esewa',   label: 'eSewa',   emoji: '🟢' },
  { value: 'khalti',  label: 'Khalti',  emoji: '🟣' },
  { value: 'fonepay', label: 'FonePay', emoji: '📱' },
  { value: 'credit',  label: 'Credit',  emoji: '📒' },
]

export default function EditTransactionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [origTx,        setOrigTx]        = useState<Transaction | null>(null)
  const [type,          setType]          = useState<TransactionType>('in')
  const [amount,        setAmount]        = useState('')
  const [category,      setCategory]      = useState<TransactionCategory>('sales')
  const [description,   setDescription]   = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [date,          setDate]          = useState(new Date().toISOString().split('T')[0])

  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [voiding,  setVoiding]  = useState(false)
  const [error,    setError]    = useState('')

  const isVoided = description.startsWith('[VOIDED]')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('transactions').select('*').eq('id', id).single()
      if (!data) { router.push('/hisab'); return }

      const tx = data as Transaction
      setOrigTx(tx)
      setType(tx.type)
      setAmount(String(tx.amount))
      setCategory(tx.category)
      setDescription(tx.description ?? '')
      setPaymentMethod(tx.payment_method)
      setDate(tx.transaction_date)
      setLoading(false)
    }
    load()
  }, [id, router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setError('Enter a valid amount'); return }

    setSaving(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.from('transactions').update({
      type, amount: amt, category,
      description: description.trim() || null,
      payment_method: paymentMethod,
      transaction_date: date,
    }).eq('id', id)

    if (updateError) { setError('Failed to save. Try again.'); setSaving(false); return }
    router.push('/hisab')
  }

  async function handleVoid() {
    if (!origTx) return
    setVoiding(true)
    const supabase = createClient()

    // 1. Mark original as voided
    await supabase.from('transactions').update({
      description: `[VOIDED] ${origTx.description ?? ''}`.trim(),
    }).eq('id', id)

    // 2. Create reversing / offsetting entry
    const { data: biz } = await supabase
      .from('businesses').select('id').eq('owner_id', (await supabase.auth.getUser()).data.user!.id).single()

    await supabase.from('transactions').insert({
      business_id:      biz!.id,
      type:             origTx.type === 'in' ? 'out' : 'in',
      amount:           Number(origTx.amount),
      discount_percent: 0,
      category:         origTx.category,
      description:      `VOID REVERSAL: ${origTx.description ?? ''}`.trim(),
      payment_method:   origTx.payment_method,
      transaction_date: new Date().toISOString().split('T')[0],
      created_by:       null,
    })

    router.push('/hisab')
  }

  const isIn = type === 'in'
  const accentGrad   = isIn ? 'from-green-600 to-emerald-700' : 'from-red-600 to-rose-700'
  const accentBorder = isIn ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-red-500 bg-red-500/10 text-red-400'
  const inputClass   = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-orange-500/50 text-base"

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-gray-400 text-lg">
      Loading...
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-10">
      {/* Header */}
      <div className={`bg-gradient-to-br ${accentGrad} px-4 pt-5 pb-8`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/20 text-white active:scale-95">
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-xl font-bold text-white">
              {isVoided ? '🚫 Voided Entry' : 'Edit Entry'}
            </h1>
          </div>

          {/* Void button */}
          {!isVoided && (
            <AlertDialog>
              <AlertDialogTrigger className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 text-white text-sm font-semibold active:scale-95">
                <RotateCcw size={16} /> Void
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Void this transaction?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the original as voided and create a reversing entry (NPR {Number(origTx?.amount ?? 0).toLocaleString()}) in the ledger. Stock is not automatically reversed — adjust Godam manually if needed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleVoid}
                    disabled={voiding}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {voiding ? 'Voiding...' : 'Yes, Void It'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Income / Expense toggle */}
        {!isVoided && (
          <div className="flex bg-black/20 rounded-2xl p-1 gap-1">
            <button type="button" onClick={() => { setType('in'); setCategory('sales') }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all ${isIn ? 'bg-white text-green-700 shadow' : 'text-white/70'}`}>
              <TrendingUp size={22} /> Income
            </button>
            <button type="button" onClick={() => { setType('out'); setCategory('expense') }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all ${!isIn ? 'bg-white text-red-700 shadow' : 'text-white/70'}`}>
              <TrendingDown size={22} /> Expense
            </button>
          </div>
        )}
      </div>

      {isVoided ? (
        <div className="px-4 pt-6 text-center">
          <p className="text-5xl mb-4">🚫</p>
          <p className="text-lg font-semibold text-gray-400">This transaction has been voided</p>
          <p className="text-sm text-gray-600 mt-2">A reversing entry was created in the ledger</p>
          <button
            onClick={() => router.push('/hisab')}
            className="mt-6 w-full py-4 bg-white/10 border border-white/10 text-white rounded-2xl font-bold active:scale-95"
          >
            Back to Ledger
          </button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="px-4 -mt-4 space-y-4">
          {/* Amount */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-5 shadow-xl">
            <p className="text-sm font-semibold text-gray-400 mb-3">Amount (NPR) *</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-gray-600">Rs.</span>
              <input
                type="number" inputMode="decimal" placeholder="0" value={amount}
                onChange={e => setAmount(e.target.value)}
                className={`flex-1 text-5xl font-bold outline-none bg-transparent w-full ${isIn ? 'text-green-400' : 'text-red-400'} placeholder:text-gray-800`}
                required min="0.01"
              />
            </div>
          </div>

          {/* Category */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
            <p className="text-sm font-semibold text-gray-400 mb-3">Category *</p>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                    category === cat.value ? accentBorder : 'border-white/10 text-gray-500'
                  }`}>
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-xs font-semibold">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
            <p className="text-sm font-semibold text-gray-400 mb-3">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(pm => (
                <button key={pm.value} type="button" onClick={() => setPaymentMethod(pm.value)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                    paymentMethod === pm.value
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                      : 'border-white/10 text-gray-500'
                  }`}>
                  <span className="text-xl">{pm.emoji}</span>
                  <span className="text-sm font-semibold">{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
            <p className="text-sm font-semibold text-gray-400 mb-3">Description</p>
            <input type="text" placeholder="e.g. Rice sold, electricity bill..." value={description}
              onChange={e => setDescription(e.target.value)} className={inputClass} />
          </div>

          {/* Date */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
            <p className="text-sm font-semibold text-gray-400 mb-3">Date</p>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]} className={inputClass} />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-base font-medium">{error}</p>
            </div>
          )}

          <button type="submit" disabled={saving || !amount}
            className={`w-full py-5 rounded-2xl text-white font-bold text-xl active:scale-[0.98] transition-all disabled:opacity-50 bg-gradient-to-r ${accentGrad}`}>
            {saving ? 'Saving...' : '✓ Save Changes'}
          </button>
        </form>
      )}
    </div>
  )
}
