'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/db/supabase'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import type { PaymentMethod, TransactionType } from '@/lib/types/database'

/** Payment methods that match the DB check constraint */
const PAYMENT_METHODS: { value: PaymentMethod; label: string; emoji: string }[] = [
  { value: 'cash',   label: 'Cash',   emoji: '💵' },
  { value: 'khata',  label: 'Khata',  emoji: '📒' },
  { value: 'esewa',  label: 'eSewa',  emoji: '🟢' },
  { value: 'khalti', label: 'Khalti', emoji: '🟣' },
]

/** Quick-tap amount shortcuts */
const QUICK_AMOUNTS = [100, 500, 1000, 5000] as const

function NewTransactionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [transactionType, setTransactionType] = useState<TransactionType>(
    searchParams.get('type') === 'expense' ? 'expense' : 'income'
  )
  const [amount,          setAmount]          = useState('')
  const [itemName,        setItemName]        = useState('')
  const [paymentMethod,   setPaymentMethod]   = useState<PaymentMethod>('cash')
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState('')

  const isIncome   = transactionType === 'income'
  const parsedAmt  = parseFloat(amount) || 0

  const accentGradient  = isIncome ? 'from-green-600 to-emerald-700' : 'from-red-600 to-rose-700'
  const accentText      = isIncome ? 'text-green-400' : 'text-red-400'
  const inputClass      = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-orange-500/50 text-base'

  /** Validate and insert the transaction into the DB */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!parsedAmt || parsedAmt <= 0) {
      setError('Enter a valid amount')
      return
    }

    if (!itemName.trim()) {
      setError('Enter a description')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!business) { router.push('/onboarding'); return }

    const { error: insertError } = await supabase.from('transactions').insert({
      business_id:    business.id,
      type:           transactionType,
      amount:         parsedAmt,
      item_name:      itemName.trim(),
      payment_method: paymentMethod,
    })

    if (insertError) {
      setError('Failed to save. Please try again.')
      setLoading(false)
      return
    }

    router.push('/hisab')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-10">
      {/* Header gradient with income/expense toggle */}
      <div className={`bg-gradient-to-br ${accentGradient} px-4 pt-5 pb-8`}>
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">New Entry</h1>
        </div>

        <div className="flex bg-black/20 rounded-2xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setTransactionType('income')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all ${
              isIncome ? 'bg-white text-green-700 shadow-lg' : 'text-white/70'
            }`}
          >
            <TrendingUp size={22} /> Income
          </button>
          <button
            type="button"
            onClick={() => setTransactionType('expense')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all ${
              !isIncome ? 'bg-white text-red-700 shadow-lg' : 'text-white/70'
            }`}
          >
            <TrendingDown size={22} /> Expense
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 -mt-4 space-y-4">

        {/* Amount input with quick-tap shortcuts */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-5 shadow-xl">
          <p className="text-sm font-semibold text-gray-400 mb-3">Amount (NPR) *</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-600">Rs.</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={`flex-1 text-5xl font-bold outline-none bg-transparent w-full ${accentText} placeholder:text-gray-800`}
              required
              min="0.01"
            />
          </div>
          <div className="border-t border-white/10 mt-3 pt-3 flex gap-2">
            {QUICK_AMOUNTS.map(quickAmount => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => setAmount(String(quickAmount))}
                className="flex-1 py-2 rounded-lg bg-white/10 text-gray-400 font-semibold text-sm active:scale-95 transition-transform"
              >
                {quickAmount}
              </button>
            ))}
          </div>
        </div>

        {/* Description — stored as item_name in the DB */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
          <p className="text-sm font-semibold text-gray-400 mb-3">Description *</p>
          <input
            type="text"
            placeholder="e.g. Rice sold, electricity bill..."
            value={itemName}
            onChange={e => setItemName(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        {/* Payment method selector */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
          <p className="text-sm font-semibold text-gray-400 mb-3">Payment Method *</p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map(pm => (
              <button
                key={pm.value}
                type="button"
                onClick={() => setPaymentMethod(pm.value)}
                className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                  paymentMethod === pm.value
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                    : 'border-white/10 text-gray-500'
                }`}
              >
                <span className="text-xl">{pm.emoji}</span>
                <span className="text-sm font-semibold">{pm.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400 text-base font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !amount || !itemName}
          className={`w-full py-5 rounded-2xl text-white font-bold text-xl active:scale-[0.98] transition-all disabled:opacity-50 bg-gradient-to-r ${accentGradient}`}
        >
          {loading ? 'Saving...' : isIncome ? '✓ Save Income' : '✓ Save Expense'}
        </button>
      </form>
    </div>
  )
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <NewTransactionForm />
    </Suspense>
  )
}
