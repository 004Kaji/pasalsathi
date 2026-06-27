'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import type { Plan } from '@/types/database'

const UNITS = [
  { value: 'piece', label: 'पिस', emoji: '📦' },
  { value: 'kg',    label: 'केजी',  emoji: '⚖️' },
  { value: 'litre', label: 'लिटर', emoji: '🧴' },
  { value: 'box',   label: 'बक्स',  emoji: '🗃️' },
  { value: 'dozen', label: 'दर्जन', emoji: '🔢' },
]

export default function NewProductPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('piece')
  const [buyingPrice, setBuyingPrice] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [currentStock, setCurrentStock] = useState('')
  const [lowThreshold, setLowThreshold] = useState('5')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('सामानको नाम आवश्यक छ'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: biz } = await supabase
      .from('businesses')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single()
    if (!biz) { router.push('/onboarding'); return }

    // Plan limit check
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', biz.id)
      .eq('is_active', true)

    const limit = PLAN_LIMITS[biz.plan as Plan].products
    if (limit !== Infinity && (count ?? 0) >= limit) {
      setError(`तपाईंको प्लानमा अधिकतम ${limit} सामान राख्न सकिन्छ। अपग्रेड गर्नुहोस्।`)
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('products').insert({
      business_id: biz.id,
      name: name.trim(),
      unit,
      buying_price: parseFloat(buyingPrice) || 0,
      selling_price: parseFloat(sellingPrice) || 0,
      current_stock: parseFloat(currentStock) || 0,
      low_stock_threshold: parseFloat(lowThreshold) || 5,
    })

    if (insertError) {
      setError('सामान थप्न समस्या भयो। फेरि प्रयास गर्नुहोस्।')
      setLoading(false)
      return
    }

    router.push('/godam')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 px-4 pt-5 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">नयाँ सामान थप्नुहोस्</h1>
        </div>
        <p className="text-blue-100 text-sm mt-3">
          सामानको मूल्य र स्टक राख्नुहोस्
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-5 space-y-4 pb-10">

        {/* Name */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-2">
          <Label className="text-base font-semibold text-gray-700">
            सामानको नाम <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="जस्तै: बासमती चामल, तेल, सिमेन्ट..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-base h-12 rounded-xl"
            required
          />
        </div>

        {/* Unit */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <Label className="text-base font-semibold text-gray-700 block mb-3">एकाइ (Unit)</Label>
          <div className="grid grid-cols-5 gap-2">
            {UNITS.map((u) => (
              <button
                key={u.value}
                type="button"
                onClick={() => setUnit(u.value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                  unit === u.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-100 text-gray-600'
                }`}
              >
                <span className="text-2xl">{u.emoji}</span>
                <span className="text-xs font-semibold">{u.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prices */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-gray-700">मूल्य</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">किनेको मूल्य</Label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-12">
                <span className="px-3 bg-gray-50 text-gray-500 text-sm border-r border-gray-200 h-full flex items-center">रु.</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={buyingPrice}
                  onChange={(e) => setBuyingPrice(e.target.value)}
                  className="flex-1 px-3 text-base outline-none bg-transparent"
                  min="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">बेच्ने मूल्य</Label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-12">
                <span className="px-3 bg-gray-50 text-gray-500 text-sm border-r border-gray-200 h-full flex items-center">रु.</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="flex-1 px-3 text-base outline-none bg-transparent"
                  min="0"
                />
              </div>
            </div>
          </div>
          {buyingPrice && sellingPrice && Number(sellingPrice) > Number(buyingPrice) && (
            <p className="text-sm text-green-600 font-medium bg-green-50 rounded-lg px-3 py-2">
              ✓ नाफा: NPR {(Number(sellingPrice) - Number(buyingPrice)).toLocaleString('ne-NP')} प्रति{' '}
              {UNITS.find((u) => u.value === unit)?.label}
            </p>
          )}
        </div>

        {/* Stock */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-gray-700">स्टक</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">हालको स्टक</Label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-12">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                  className="flex-1 px-3 text-base outline-none bg-transparent"
                  min="0"
                />
                <span className="px-3 bg-gray-50 text-gray-500 text-sm border-l border-gray-200 h-full flex items-center">
                  {UNITS.find((u) => u.value === unit)?.label}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">कम स्टक अलर्ट</Label>
              <div className="flex items-center border border-orange-200 rounded-xl overflow-hidden h-12 bg-orange-50">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="5"
                  value={lowThreshold}
                  onChange={(e) => setLowThreshold(e.target.value)}
                  className="flex-1 px-3 text-base outline-none bg-transparent"
                  min="0"
                />
                <span className="px-3 text-orange-500 text-sm border-l border-orange-200 h-full flex items-center">
                  {UNITS.find((u) => u.value === unit)?.label}
                </span>
              </div>
              <p className="text-xs text-gray-400">यति भन्दा कम भए सतर्कता आउँछ</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-base">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full py-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? 'थप्दैछ...' : '✓ सामान थप्नुहोस्'}
        </button>
      </form>
    </div>
  )
}
