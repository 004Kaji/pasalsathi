'use client'
/**
 * product-grid.tsx
 * Grid of product/service tiles + a custom-item button.
 * Column names match 004_clean_schema.sql: type, stock, price (not item_type, current_stock, selling_price).
 */

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
                ? 'bg-white/[0.02] border-white/5 opacity-50'
                : inCart
                  ? isService
                    ? 'bg-purple-500/10 border-purple-500/40'
                    : 'bg-orange-500/10 border-orange-500/40'
                  : 'bg-white/5 border-white/10'
            }`}
          >
            {/* Quantity badge when item is in cart */}
            {inCart && (
              <div className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                isService ? 'bg-purple-600' : 'bg-orange-600'
              }`}>
                {inCart.qty}
              </div>
            )}

            <div className="text-xl mb-2">
              {isService ? '🛠️' : outOfStock ? '📭' : '📦'}
            </div>

            <p className="text-sm font-bold text-white leading-tight line-clamp-2 mb-1.5 pr-6">
              {product.name}
            </p>

            <p className={`text-base font-black ${
              isService ? 'text-purple-400' : outOfStock ? 'text-gray-600' : 'text-orange-400'
            }`}>
              NPR {Number(product.price).toLocaleString('ne-NP')}
            </p>

            {/* Stock count — only shown for physical products */}
            {!isService && (
              <p className={`text-[11px] mt-0.5 ${outOfStock ? 'text-red-500' : 'text-gray-600'}`}>
                {outOfStock ? 'Out of stock' : `${product.stock} ${product.unit}`}
              </p>
            )}
          </button>
        )
      })}

      {/* Custom item button — lets cashier add an item not in the catalog */}
      <button
        onClick={onAddCustom}
        className="border border-dashed border-white/15 rounded-2xl p-3.5 flex flex-col items-center justify-center min-h-[108px] active:scale-[0.97] transition-all"
      >
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2">
          <Plus size={20} className="text-gray-500" />
        </div>
        <p className="text-xs font-semibold text-gray-500">Custom Item</p>
      </button>
    </div>
  )
}
