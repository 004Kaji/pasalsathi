'use client'
// Displays the current cart items with qty controls, inline price editing, and discount row
import { Plus, Minus, X, Tag } from 'lucide-react'
import type { CartItem } from '@/lib/types/app'

interface Props {
  cart: CartItem[]
  discountPercent: string
  onUpdateQty: (id: string, delta: number) => void
  onUpdatePrice: (id: string, price: string) => void
  onRemoveItem: (id: string) => void
  onDiscountChange: (v: string) => void
}

export default function CartList({
  cart, discountPercent,
  onUpdateQty, onUpdatePrice, onRemoveItem, onDiscountChange,
}: Props) {
  const subtotal    = cart.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const discPct     = parseFloat(discountPercent) || 0
  const discountAmt = subtotal * (discPct / 100)

  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Order · {cart.reduce((s, i) => s + i.qty, 0)} items
          </p>
        </div>

        <div className="divide-y divide-white/5">
          {cart.map(item => (
            <div key={item.id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{item.name}</p>
                  {item.isQuick && (
                    <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-bold shrink-0">QUICK</span>
                  )}
                  {!item.isQuick && item.product?.type === 'service' && (
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-bold shrink-0">SVC</span>
                  )}
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 text-gray-600 active:text-red-400 shrink-0 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white/10 rounded-xl overflow-hidden shrink-0">
                  <button onClick={() => onUpdateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-gray-400 active:bg-white/10">
                    <Minus size={14} />
                  </button>
                  <span className="px-2 text-white font-bold text-sm min-w-[1.75rem] text-center">{item.qty}</span>
                  <button
                    onClick={() => onUpdateQty(item.id, 1)}
                    disabled={
                      !item.isQuick &&
                      !!item.product &&
                      item.product.type !== 'service' &&
                      item.product.track_stock &&
                      item.qty >= item.product.stock
                    }
                    className="w-8 h-8 flex items-center justify-center text-gray-400 active:bg-white/10 disabled:opacity-30"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 flex-1 min-w-0">
                  <span className="text-gray-600 text-xs mr-1 shrink-0">Rs.</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={item.unitPrice}
                    onChange={e => onUpdatePrice(item.id, e.target.value)}
                    className="flex-1 bg-transparent text-white font-semibold text-sm outline-none min-w-0"
                  />
                </div>

                <p className="text-sm font-bold text-orange-400 shrink-0 min-w-[4.5rem] text-right">
                  NPR {(item.qty * item.unitPrice).toLocaleString('ne-NP')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Discount row */}
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
        <Tag size={16} className="text-amber-400 shrink-0" />
        <span className="text-sm font-semibold text-amber-400 shrink-0">Discount</span>
        <input
          type="number"
          min="0"
          max="100"
          placeholder="0"
          value={discountPercent}
          onChange={e => onDiscountChange(e.target.value)}
          className="w-16 bg-amber-500/10 border border-amber-500/30 rounded-xl px-2 py-1.5 text-amber-300 font-bold text-base text-center outline-none"
        />
        <span className="text-amber-400 font-bold">%</span>
        {discPct > 0 && (
          <p className="flex-1 text-right text-sm text-amber-400 font-semibold">
            − NPR {discountAmt.toLocaleString('ne-NP', { maximumFractionDigits: 0 })}
          </p>
        )}
      </div>
    </>
  )
}
