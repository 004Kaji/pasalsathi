'use client'

import { Plus } from 'lucide-react'
import type { Product } from '@/lib/types/database'
import type { CartItem } from '@/lib/types/app'

interface Props {
  products: Product[]
  cart: CartItem[]
  onSelect: (product: Product) => void
  onAddCustom: () => void
}

export default function ProductGrid({ products, cart, onSelect, onAddCustom }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map(product => {
        const isService  = product.type === 'service'
        const outOfStock = !isService && product.track_stock && product.stock <= 0
        const inCart     = cart.find(item => item.id === product.id)

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
            {/* Quantity badge when item is in cart */}
            {inCart && (
              <div className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                isService ? 'bg-purple-600' : 'bg-[#C84B2F]'
              }`}>
                {inCart.qty}
              </div>
            )}

            <div className="text-xl mb-2">
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

            {/* Stock count — only shown for physical products */}
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
