'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, TrendingUp, TrendingDown, Tag } from 'lucide-react'
import type { TransactionCategory, PaymentMethod, TransactionType } from '@/types/database'

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
  { value: 'esewa',   label: 'eSewa',  emoji: '🟢' },
  { value: 'khalti',  label: 'Khalti', emoji: '🟣' },
  { value: 'fonepay', label: 'FonePay', emoji: '📱' },
  { value: 'credit',  label: 'Credit',  emoji: '📒' },
]

const QUICK_AMOUNTS = [100, 500, 1000, 5000]

export default function NewTransactionPage() {
  const router = useRouter()
  const [type, setType] = useState<TransactionType>('in')
  const [amount, setAmount] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')
  const [category, setCategory] = useState<TransactionCategory>('sales')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isIn = type === 'in'
  const isSales = category === 'sales'
  const rawAmt = parseFloat(amount) || 0
  const discPct = parseFloat(discountPercent) || 0
  const discountAmt = rawAmt * (discPct / 100)
  const finalAmt = rawAmt - discountAmt
  const highDiscount = discPct > 20

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!rawAmt || rawAmt <= 0) { setError('Enter a valid amount'); return }
    if (discPct < 0 || discPct > 100) { setError('Discount must be 0-100'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: biz } = await supabase
      .from('businesses').select('id').eq('owner_id', user.id).single()
    if (!biz) { router.push('/onboarding'); return }

    const { error: insertError } = await supabase.from('transactions').insert({
      business_id: biz.id,
      type,
      amount: isSales && discPct > 0 ? finalAmt : rawAmt,
      discount_percent: isSales ? discPct : 0,
      category,
      description: description.trim() || null,
      payment_method: paymentMethod,
      transaction_date: date,
      created_by: user.id,
    })

    if (insertError) {
      setError('Failed to save. Please try again.')
      setLoading(false)
      return
    }

    router.push('/hisab')
  }

  const accentActive = isIn ? 'from-green-600 to-emerald-700' : 'from-red-600 to-rose-700'
  const accentText = isIn ? 'text-green-400' : 'text-red-400'
  const accentBorder = isIn ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-red-500 bg-red-500/10 text-red-400'
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-orange-500/50 text-base"

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-10">
      {/* Header */}
      <div className={`bg-gradient-to-br ${accentActive} px-4 pt-5 pb-8`}>
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">New Entry</h1>
        </div>

        {/* आम्दानी / खर्च toggle */}
        <div className="flex bg-black/20 rounded-2xl p-1 gap-1">
          <button
            type="button"
            onClick={() => { setType('in'); setCategory('sales') }}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all ${
              isIn ? 'bg-white text-green-700 shadow-lg' : 'text-white/70'
            }`}
          >
            <TrendingUp size={22} /> Income
          </button>
          <button
            type="button"
            onClick={() => { setType('out'); setCategory('expense'); setDiscountPercent('') }}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all ${
              !isIn ? 'bg-white text-red-700 shadow-lg' : 'text-white/70'
            }`}
          >
            <TrendingDown size={22} /> Expense
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 -mt-4 space-y-4">

        {/* Amount card */}
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

          {/* Quick amounts */}
          <div className="border-t border-white/10 mt-3 pt-3 flex gap-2">
            {QUICK_AMOUNTS.map(q => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(String(q))}
                className="flex-1 py-2 rounded-lg bg-white/10 text-gray-400 font-semibold text-sm active:scale-95 transition-transform"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Discount — only for sales */}
          {isIn && isSales && (
            <div className="border-t border-white/10 mt-3 pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <Tag size={15} className="text-amber-400" />
                <p className="text-sm font-medium text-amber-400">Discount</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={discountPercent}
                  onChange={e => setDiscountPercent(e.target.value)}
                  min="0"
                  max="100"
                  className="w-24 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-amber-300 font-bold text-xl text-center outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <span className="text-amber-400 font-bold text-xl">%</span>
                {discPct > 0 && rawAmt > 0 && (
                  <div className="flex-1 text-right">
                    <p className="text-xs text-gray-500">Discount: Rs. {discountAmt.toLocaleString('ne-NP', { maximumFractionDigits: 2 })}</p>
                    <p className={`text-base font-bold ${highDiscount ? 'text-red-400' : 'text-green-400'}`}>
                      Final: Rs. {finalAmt.toLocaleString('ne-NP', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
              {highDiscount && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">
                  <span className="text-lg">⚠️</span>
                  <p className="text-xs text-red-400 font-medium">High discount! Owner approval required.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Category */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
          <p className="text-sm font-semibold text-gray-400 mb-3">Category *</p>
          <div className="grid grid-cols-5 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  setCategory(cat.value)
                  if (cat.value !== 'sales') setDiscountPercent('')
                }}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                  category === cat.value ? accentBorder : 'border-white/10 text-gray-500'
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-xs font-semibold">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
          <p className="text-sm font-semibold text-gray-400 mb-3">Payment Method *</p>
          <div className="grid grid-cols-3 gap-2">
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

        {/* Description */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
          <p className="text-sm font-semibold text-gray-400 mb-3">Description (optional)</p>
          <input
            type="text"
            placeholder="e.g. Rice sold, electricity bill..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Date */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
          <p className="text-sm font-semibold text-gray-400 mb-3">Date</p>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className={inputClass}
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400 text-base font-medium">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !amount}
          className={`w-full py-5 rounded-2xl text-white font-bold text-xl active:scale-[0.98] transition-all disabled:opacity-50 bg-gradient-to-r ${accentActive}`}
        >
          {loading
            ? 'Saving...'
            : isIn
              ? isSales && discPct > 0
                ? `✓ Save Income Rs. ${finalAmt.toLocaleString('ne-NP', { maximumFractionDigits: 2 })}`
                : '✓ Save Income'
              : '✓ Save Expense'}
        </button>
      </form>
    </div>
  )
}
