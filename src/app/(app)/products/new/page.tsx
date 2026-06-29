'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/db/supabase'
import { ArrowLeft, Package, Wrench, UtensilsCrossed } from 'lucide-react'
import type { ProductUnit, ProductType } from '@/lib/types/database'

const PRODUCT_UNITS: { value: ProductUnit; label: string; emoji: string }[] = [
  { value: 'piece', label: 'Piece', emoji: '📦' },
  { value: 'kg',    label: 'Kg',   emoji: '⚖️' },
  { value: 'litre', label: 'Litre',emoji: '🧴' },
  { value: 'box',   label: 'Box',  emoji: '🗃️' },
  { value: 'dozen', label: 'Dozen',emoji: '🔢' },
]

const SERVICE_UNITS: { value: ProductUnit; label: string; emoji: string }[] = [
  { value: 'piece', label: 'Per item', emoji: '✂️' },
  { value: 'box',   label: 'Per box',  emoji: '📦' },
]

const MENU_UNITS: { value: ProductUnit; label: string; emoji: string }[] = [
  { value: 'piece', label: 'Per plate', emoji: '🍽️' },
  { value: 'box',   label: 'Per box',   emoji: '📦' },
]

const TYPE_CONFIG = {
  product: {
    accent:      'from-[#C84B2F] to-red-600',
    accentBorder:'border-[#C84B2F] bg-[#C84B2F]/10 text-[#C84B2F]',
    emoji:       '📦',
    label:       'Product',
    hint:        '📦 Products track stock levels. You\'ll see low-stock alerts and can restock.',
    namePlaceholder: 'e.g. Basmati Rice, Cement Bag, Oil...',
    submitLabel: '✓ Add Product',
  },
  service: {
    accent:      'from-purple-600 to-violet-700',
    accentBorder:'border-purple-500 bg-purple-500/10 text-purple-600',
    emoji:       '🛠️',
    label:       'Service',
    hint:        '✂️ Services appear in Sell → Catalog. No stock tracking — just a name & price.',
    namePlaceholder: 'e.g. Haircut, Full Body Massage, Tax Filing...',
    submitLabel: '✓ Add Service',
  },
  menu: {
    accent:      'from-[#C9933A] to-amber-600',
    accentBorder:'border-[#C9933A] bg-[#C9933A]/10 text-[#C9933A]',
    emoji:       '🍽️',
    label:       'Menu',
    hint:        '🍽️ Menu items appear in Sell → Catalog. Perfect for restaurants — no stock tracking.',
    namePlaceholder: 'e.g. Momo (Steam), Dal Bhat Set, Chicken Chowmein...',
    submitLabel: '✓ Add Menu Item',
  },
}

function NewProductForm() {
  const router  = useRouter()
  const params  = useSearchParams()

  const rawType = params.get('type') ?? 'product'
  const initType: ProductType = rawType === 'service' ? 'service' : rawType === 'menu' ? 'menu' : 'product'

  const [itemType,     setItemType]     = useState<ProductType>(initType)
  const [name,         setName]         = useState('')
  const [unit,         setUnit]         = useState<ProductUnit>('piece')
  const [sellingPrice, setSellingPrice] = useState('')
  const [currentStock, setCurrentStock] = useState('')
  const [lowThreshold, setLowThreshold] = useState('5')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const isProduct = itemType === 'product'
  const cfg       = TYPE_CONFIG[itemType]
  const units     = itemType === 'product' ? PRODUCT_UNITS : itemType === 'service' ? SERVICE_UNITS : MENU_UNITS

  function handleTypeSwitch(t: ProductType) {
    setItemType(t)
    setUnit('piece')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Name is required'); return }
    if (!sellingPrice || parseFloat(sellingPrice) <= 0) { setError('Enter a valid price'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: biz } = await supabase
      .from('businesses').select('id').eq('owner_id', user.id).single()
    if (!biz) { router.push('/home'); return }

    const { error: insertError } = await supabase.from('products').insert({
      business_id: biz.id,
      name:        name.trim(),
      unit,
      type:        itemType,
      price:       parseFloat(sellingPrice) || 0,
      stock:       isProduct ? (parseFloat(currentStock) || 0) : 0,
      track_stock: isProduct,
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }
    router.push('/products')
  }

  const inputClass = "w-full bg-white border border-[#D5CFC6] rounded-xl px-4 h-12 text-[#1C1917] placeholder:text-[#9B948E] outline-none focus:ring-2 focus:ring-[#C84B2F]/30 text-base"

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-10">

      {/* Header */}
      <div className={`bg-gradient-to-br ${cfg.accent} px-4 pt-5 pb-8`}>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/20 text-white active:scale-95">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">
            {cfg.emoji} Add {cfg.label}
          </h1>
        </div>

        {/* Type toggle */}
        <div className="flex bg-black/20 rounded-2xl p-1 gap-1">
          {([
            { key: 'product', icon: <Package size={18} />,          label: 'Product', activeText: 'text-[#C84B2F]' },
            { key: 'service', icon: <Wrench size={18} />,           label: 'Service', activeText: 'text-purple-600' },
            { key: 'menu',    icon: <UtensilsCrossed size={18} />,  label: 'Menu',    activeText: 'text-[#C9933A]' },
          ] as const).map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTypeSwitch(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm transition-all ${
                itemType === t.key ? `bg-white ${t.activeText} shadow` : 'text-white/70'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Context hint */}
      <div className="mx-4 -mt-4 bg-white border border-[#D5CFC6] rounded-2xl px-4 py-3 text-sm text-[#6B6560] shadow-sm">
        {cfg.hint}
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-4">

        {/* Name */}
        <div className="bg-white border border-[#D5CFC6] rounded-2xl p-5 space-y-3 shadow-sm">
          <label className="text-sm font-semibold text-[#6B6560] block">
            {cfg.label} Name *
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={cfg.namePlaceholder}
            className={inputClass}
            required
          />
        </div>

        {/* Unit */}
        <div className="bg-white border border-[#D5CFC6] rounded-2xl p-5 shadow-sm">
          <label className="text-sm font-semibold text-[#6B6560] block mb-3">
            {isProduct ? 'Unit of Sale' : 'Pricing Unit'}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {units.map(u => (
              <button
                key={u.value}
                type="button"
                onClick={() => setUnit(u.value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                  unit === u.value ? cfg.accentBorder : 'border-[#D5CFC6] text-[#9B948E]'
                }`}
              >
                <span className="text-2xl">{u.emoji}</span>
                <span className="text-xs font-semibold">{u.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="bg-white border border-[#D5CFC6] rounded-2xl p-5 space-y-3 shadow-sm">
          <label className="text-sm font-semibold text-[#6B6560] block">
            {isProduct ? 'Selling Price *' : 'Price *'}
          </label>
          <div className="flex items-center bg-white border border-[#D5CFC6] rounded-xl overflow-hidden h-12">
            <span className="px-3 text-[#9B948E] text-sm border-r border-[#D5CFC6] h-full flex items-center">Rs.</span>
            <input
              type="number" inputMode="decimal" placeholder="0"
              value={sellingPrice} onChange={e => setSellingPrice(e.target.value)}
              className="flex-1 px-3 text-base outline-none bg-transparent text-[#1C1917]"
              min="0" step="any" required
            />
          </div>
        </div>

        {/* Stock — products only */}
        {isProduct && (
          <div className="bg-white border border-[#D5CFC6] rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-[#1C1917]">Opening Stock <span className="text-sm font-normal text-[#9B948E]">(optional)</span></h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-[#6B6560] font-semibold mb-2 block">Current Stock</label>
                <div className="flex items-center bg-white border border-[#D5CFC6] rounded-xl overflow-hidden h-12">
                  <input
                    type="number" inputMode="decimal" placeholder="0"
                    value={currentStock} onChange={e => setCurrentStock(e.target.value)}
                    className="flex-1 px-3 text-base outline-none bg-transparent text-[#1C1917]"
                    min="0"
                  />
                  <span className="px-3 text-[#9B948E] text-sm border-l border-[#D5CFC6] h-full flex items-center">
                    {PRODUCT_UNITS.find(u2 => u2.value === unit)?.label ?? unit}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-[#6B6560] font-semibold mb-2 block">Low Stock Alert</label>
                <div className="flex items-center bg-amber-500/10 border border-amber-500/20 rounded-xl overflow-hidden h-12">
                  <input
                    type="number" inputMode="decimal" placeholder="5"
                    value={lowThreshold} onChange={e => setLowThreshold(e.target.value)}
                    className="flex-1 px-3 text-base outline-none bg-transparent text-amber-700"
                    min="0"
                  />
                  <span className="px-3 text-amber-600 text-sm border-l border-amber-500/20 h-full flex items-center">
                    {PRODUCT_UNITS.find(u2 => u2.value === unit)?.label ?? unit}
                  </span>
                </div>
                <p className="text-xs text-[#9B948E] mt-1">Alert below this</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-500 text-base font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim() || !sellingPrice}
          className={`w-full py-5 rounded-2xl text-white font-bold text-xl active:scale-[0.98] transition-all disabled:opacity-50 bg-gradient-to-r ${cfg.accent}`}
        >
          {loading ? 'Adding...' : cfg.submitLabel}
        </button>
      </form>
    </div>
  )
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#F5F0E8] text-[#6B6560]">Loading...</div>}>
      <NewProductForm />
    </Suspense>
  )
}
