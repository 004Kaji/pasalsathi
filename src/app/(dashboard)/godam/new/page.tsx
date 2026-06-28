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
  { value: 'piece', label: 'Piece', emoji: '📦' },
  { value: 'kg',    label: 'Kg',    emoji: '⚖️' },
  { value: 'litre', label: 'Litre', emoji: '🧴' },
  { value: 'box',   label: 'Box',   emoji: '🗃️' },
  { value: 'dozen', label: 'Dozen', emoji: '🔢' },
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
    if (!name.trim()) { setError('Item name is required'); return }

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
      setError(`Your plan allows a maximum of ${limit} items. Please upgrade.`)
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
      setError('Error adding item. Please try again.')
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
          <h1 className="text-xl font-bold text-white">Add New Item</h1>
        </div>
        <p className="text-blue-100 text-sm mt-3">
          Enter item price and stock details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-5 space-y-4 pb-10">

        {/* Name */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-2">
          <Label className="text-base font-semibold text-gray-700">
            Item Name <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="e.g.: Basmati Rice, Oil, Cement..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-base h-12 rounded-xl"
            required
          />
        </div>

        {/* Unit */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <Label className="text-base font-semibold text-gray-700 block mb-3">Unit</Label>
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
          <h3 className="text-base font-semibold text-gray-700">Price</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Buying Price</Label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-12">
                <span className="px-3 bg-gray-50 text-gray-500 text-sm border-r border-gray-200 h-full flex items-center">Rs.</span>
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
              <Label className="text-sm font-medium text-gray-600">Selling Price</Label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-12">
                <span className="px-3 bg-gray-50 text-gray-500 text-sm border-r border-gray-200 h-full flex items-center">Rs.</span>
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
              ✓ Profit: NPR {(Number(sellingPrice) - Number(buyingPrice)).toLocaleString('ne-NP')} per{' '}
              {UNITS.find((u) => u.value === unit)?.label}
            </p>
          )}
        </div>

        {/* Stock */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-gray-700">Stock</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Current Stock</Label>
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
              <Label className="text-sm font-medium text-gray-600">Low Stock Alert</Label>
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
              <p className="text-xs text-gray-400">Alert when stock falls below this</p>
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
          {loading ? 'Adding...' : '✓ Add Item'}
        </button>
      </form>
    </div>
  )
}
