'use client'

import { useEffect, useState } from 'react'
import { Plus, Minus, Star } from 'lucide-react'
import type { Product } from '@/lib/types/database'
import type { CartItem } from '@/lib/types/app'

const STORAGE_KEY = 'ps_pinned_products'

interface Props {
  products: Product[]
  cart: CartItem[]
  onSelect: (product: Product) => void
  onUpdateQty: (id: string, delta: number) => void
  onAddCustom: () => void
}

export default function ProductGrid({ products, cart, onSelect, onUpdateQty, onAddCustom }: Props) {
  const [pinned,   setPinned]   = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<string>('All')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setPinned(new Set(JSON.parse(stored) as string[]))
  }, [])

  function togglePin(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setPinned(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }

  // Build unique category tabs from products
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))]

  const filtered = activeTab === 'All' ? products : products.filter(p => p.category === activeTab)

  const sorted = [...filtered].sort((a, b) => {
    const aPin = pinned.has(a.id) ? 0 : 1
    const bPin = pinned.has(b.id) ? 0 : 1
    return aPin - bPin
  })

  return (
    <div className="space-y-3">
    {/* Category filter tabs */}
    {categories.length > 1 && (
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveTab(cat)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
              activeTab === cat
                ? 'bg-[#C84B2F] border-[#C84B2F] text-white'
                : 'border-[#D5CFC6] text-[#6B6560] bg-white'
            }`}>
            {cat}
          </button>
        ))}
      </div>
    )}
    <div className="grid grid-cols-2 gap-3">
      {sorted.map(product => {
        const isService  = product.type === 'service'
        const outOfStock = !isService && product.track_stock && product.stock <= 0
        const inCart     = cart.find(item => item.id === product.id)
        const isPinned   = pinned.has(product.id)
        const atMax      = !isService && product.track_stock && inCart ? inCart.qty >= product.stock : false

        return (
          <div
            key={product.id}
            className={`relative rounded-2xl border transition-all ${
              outOfStock
                ? 'bg-[#EDE8DF] border-[#D5CFC6] opacity-50'
                : inCart
                  ? isService
                    ? 'bg-purple-500/10 border-purple-500/40'
                    : 'bg-[#C84B2F]/10 border-[#C84B2F]/40'
                  : 'bg-[#EDE8DF] border-[#D5CFC6]'
            }`}
          >
            {/* Pin star */}
            <button
              onClick={(e) => togglePin(e, product.id)}
              className="absolute top-2 left-2 p-0.5 z-10"
            >
              <Star
                size={13}
                className={isPinned ? 'text-[#C9933A] fill-[#C9933A]' : 'text-[#9B948E]'}
              />
            </button>

            {/* Tappable product info area */}
            <button
              onClick={() => !outOfStock && onSelect(product)}
              disabled={outOfStock}
              className="w-full p-3.5 text-left active:scale-[0.97] transition-transform"
            >
              <div className="text-xl mb-2 mt-1">
                {isService ? '🛠️' : outOfStock ? '📭' : '📦'}
              </div>
              <p className="text-sm font-bold text-[#1C1917] leading-tight line-clamp-2 mb-1.5 pr-2">
                {product.name}
              </p>
              <p className={`text-base font-black ${
                isService ? 'text-purple-600' : outOfStock ? 'text-[#9B948E]' : 'text-[#C84B2F]'
              }`}>
                NPR {Number(product.price).toLocaleString('ne-NP')}
              </p>
              {!isService && (
                <p className={`text-[11px] mt-0.5 ${outOfStock ? 'text-red-500' : 'text-[#9B948E]'}`}>
                  {outOfStock ? 'Out of stock' : `${product.stock} ${product.unit}`}
                </p>
              )}
            </button>

            {/* In-cart qty controls — shown directly on card */}
            {inCart && (
              <div className="flex items-center justify-between px-2.5 pb-2.5 gap-1">
                <button
                  onClick={() => onUpdateQty(product.id, -1)}
                  className="w-8 h-8 rounded-xl bg-white border border-[#D5CFC6] flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Minus size={14} className="text-[#6B6560]" />
                </button>
                <span className={`text-base font-black ${isService ? 'text-purple-600' : 'text-[#C84B2F]'}`}>
                  {inCart.qty}
                </span>
                <button
                  onClick={() => onUpdateQty(product.id, 1)}
                  disabled={atMax}
                  className="w-8 h-8 rounded-xl bg-[#C84B2F] flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
                >
                  <Plus size={14} className="text-white" />
                </button>
              </div>
            )}

            {/* Add button when not in cart */}
            {!inCart && !outOfStock && (
              <div className="px-2.5 pb-2.5">
                <button
                  onClick={() => onSelect(product)}
                  className="w-full h-8 rounded-xl bg-[#C84B2F] flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Plus size={16} className="text-white" />
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Custom item button */}
      <button
        onClick={onAddCustom}
        className="border border-dashed border-[#D5CFC6] bg-[#EDE8DF] rounded-2xl p-3.5 flex flex-col items-center justify-center min-h-[108px] active:scale-[0.97] transition-all"
      >
        <div className="w-10 h-10 rounded-full bg-white border border-[#D5CFC6] flex items-center justify-center mb-2">
          <Plus size={20} className="text-[#9B948E]" />
        </div>
        <p className="text-xs font-semibold text-[#9B948E]">Custom Item</p>
      </button>
    </div>
    </div>
  )
}
