'use client'

import { useEffect, useState } from 'react'
import { Plus, Star } from 'lucide-react'
import type { Product } from '@/lib/types/database'
import type { CartItem } from '@/lib/types/app'

const STORAGE_KEY = 'ps_pinned_products'

interface Props {
  products: Product[]
  cart: CartItem[]
  onSelect: (product: Product) => void
  onAddCustom: () => void
}

export default function ProductGrid({ products, cart, onSelect, onAddCustom }: Props) {
  const [pinned, setPinned] = useState<Set<string>>(new Set())

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

  const sorted = [...products].sort((a, b) => {
    const aPin = pinned.has(a.id) ? 0 : 1
    const bPin = pinned.has(b.id) ? 0 : 1
    return aPin - bPin
  })

  return (
    <div className="grid grid-cols-2 gap-3">
      {sorted.map(product => {
        const isService  = product.type === 'service'
        const outOfStock = !isService && product.track_stock && product.stock <= 0
        const inCart     = cart.find(item => item.id === product.id)
        const isPinned   = pinned.has(product.id)

        return (
          <button
            key={product.id}
            onClick={() => onSelect(product)}
            disabled={outOfStock}
            className={`relative rounded-2xl p-3.5 text-left active:scale-[0.97] transition-all border ${
              outOfStock
                ? 'bg-[#EDE8DF] border-[#D5CFC6] opacity-50'
                : inCart
                  ? isService
                    ? 'bg-purple-500/10 border-purple-500/40'
                    : 'bg-[#C84B2F]/10 border-[#C84B2F]/40'
                  : 'bg-[#EDE8DF] border-[#D5CFC6]'
            }`}
          >
            {/* Pin star — top left */}
            <button
              onClick={(e) => togglePin(e, product.id)}
              className="absolute top-2 left-2 p-0.5"
            >
              <Star
                size={13}
                className={isPinned ? 'text-[#C9933A] fill-[#C9933A]' : 'text-[#9B948E]'}
              />
            </button>

            {/* Quantity badge — top right */}
            {inCart && (
              <div className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                isService ? 'bg-purple-600' : 'bg-[#C84B2F]'
              }`}>
                {inCart.qty}
              </div>
            )}

            <div className="text-xl mb-2 mt-1">
              {isService ? '🛠️' : outOfStock ? '📭' : '📦'}
            </div>

            <p className="text-sm font-bold text-[#1C1917] leading-tight line-clamp-2 mb-1.5 pr-6">
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
  )
}
