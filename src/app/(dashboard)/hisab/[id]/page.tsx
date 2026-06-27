'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import type { Transaction, TransactionCategory, PaymentMethod, TransactionType } from '@/types/database'

const CATEGORIES: { value: TransactionCategory; label: string; emoji: string }[] = [
  { value: 'sales',    label: 'बिक्री',  emoji: '💰' },
  { value: 'purchase', label: 'खरिद',   emoji: '🛒' },
  { value: 'expense',  label: 'खर्च',   emoji: '💸' },
  { value: 'salary',   label: 'तलब',    emoji: '👤' },
  { value: 'other',    label: 'अन्य',   emoji: '📦' },
]

const PAYMENT_METHODS: { value: PaymentMethod; label: string; emoji: string }[] = [
  { value: 'cash',   label: 'नगद',   emoji: '💵' },
  { value: 'bank',   label: 'बैंक',  emoji: '🏦' },
  { value: 'esewa',  label: 'eSewa', emoji: '🟢' },
  { value: 'khalti', label: 'Khalti', emoji: '🟣' },
]

export default function EditTransactionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [type, setType] = useState<TransactionType>('in')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<TransactionCategory>('sales')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single()

      if (!data) { router.push('/hisab'); return }

      const tx = data as Transaction
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setError('सही रकम हाल्नुहोस्'); return }

    setSaving(true)
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        type, amount: amt, category,
        description: description.trim() || null,
        payment_method: paymentMethod,
        transaction_date: date,
      })
      .eq('id', id)

    if (updateError) {
      setError('सुरक्षित गर्न समस्या भयो।')
      setSaving(false)
      return
    }
    router.push('/hisab')
  }

  const isIn = type === 'in'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-lg">लोड हुँदैछ...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`px-4 pt-5 pb-6 ${isIn ? 'bg-green-600' : 'bg-red-600'}`}>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">हिसाब सम्पादन</h1>
        </div>
        <div className="flex bg-white/20 rounded-2xl p-1 gap-1">
          <button type="button" onClick={() => { setType('in'); setCategory('sales') }}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all ${isIn ? 'bg-white text-green-700 shadow' : 'text-white'}`}>
            <TrendingUp size={22} /> आम्दानी
          </button>
          <button type="button" onClick={() => { setType('out'); setCategory('expense') }}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all ${!isIn ? 'bg-white text-red-700 shadow' : 'text-white'}`}>
            <TrendingDown size={22} /> खर्च
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-5 space-y-6 pb-10">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <Label className="text-base font-semibold text-gray-700 block mb-3">रकम (NPR) *</Label>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-400">रु.</span>
            <input type="number" inputMode="decimal" placeholder="0" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 text-4xl font-bold text-gray-900 border-0 outline-none bg-transparent placeholder-gray-200 w-full"
              required min="0.01" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <Label className="text-base font-semibold text-gray-700 block mb-3">किसिम *</Label>
          <div className="grid grid-cols-5 gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                  category === cat.value
                    ? isIn ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-100 text-gray-600'
                }`}>
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-xs font-semibold">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <Label className="text-base font-semibold text-gray-700 block mb-3">भुक्तानी *</Label>
          <div className="grid grid-cols-4 gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <button key={pm.value} type="button" onClick={() => setPaymentMethod(pm.value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                  paymentMethod === pm.value ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-600'
                }`}>
                <span className="text-2xl">{pm.emoji}</span>
                <span className="text-xs font-semibold">{pm.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <Label htmlFor="desc" className="text-base font-semibold text-gray-700 block mb-3">विवरण (वैकल्पिक)</Label>
          <Input id="desc" placeholder="जस्तै: चामल बेच्यो..." value={description}
            onChange={(e) => setDescription(e.target.value)} className="text-base h-12 rounded-xl" />
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <Label htmlFor="date" className="text-base font-semibold text-gray-700 block mb-3">मिति</Label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full text-base border border-gray-200 rounded-xl px-4 h-12 outline-none focus:ring-2 focus:ring-orange-400" />
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4"><p className="text-red-700 text-base font-medium">{error}</p></div>}

        <button type="submit" disabled={saving || !amount}
          className={`w-full py-5 rounded-2xl text-white font-bold text-xl active:scale-[0.98] transition-all disabled:opacity-50 ${isIn ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
          {saving ? 'सुरक्षित गर्दैछ...' : '✓ सुरक्षित गर्नुहोस्'}
        </button>
      </form>
    </div>
  )
}
