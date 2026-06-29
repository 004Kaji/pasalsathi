'use client'

import { useState } from 'react'
import { Plus, Minus, X, Tag } from 'lucide-react'
import type { CartItem } from '@/lib/types/app'

interface Props {
  cart: CartItem[]
  discountPercent: string
  discountType: 'percent' | 'amount'
  onUpdateQty: (id: string, delta: number) => void
  onUpdatePrice: (id: string, price: string) => void
  onRemoveItem: (id: string) => void
  onDiscountChange: (v: string) => void
  onDiscountTypeChange: (t: 'percent' | 'amount') => void
}

export default function CartList({
  cart, discountPercent, discountType,
  onUpdateQty, onUpdatePrice, onRemoveItem, onDiscountChange, onDiscountTypeChange,
}: Props) {
  const [editingQty, setEditingQty] = useState<string | null>(null)
  const [qtyInput,   setQtyInput]   = useState('')

  const subtotal    = cart.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const discVal     = parseFloat(discountPercent) || 0
  const discountAmt = discountType === 'amount' ? discVal : subtotal * (discVal / 100)

  function startEditQty(itemId: string, currentQty: number) {
    setEditingQty(itemId)
    setQtyInput(String(currentQty))
  }

  function commitQty(itemId: string, currentQty: number) {
    const newQty = parseInt(qtyInput, 10)
    if (!isNaN(newQty) && newQty > 0 && newQty !== currentQty) {
      onUpdateQty(itemId, newQty - currentQty)
    }
    setEditingQty(null)
    setQtyInput('')
  }

  return (
    <>
      <div className="bg-white border border-[#D5CFC6] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-[#D5CFC6]">
          <p className="text-xs font-bold text-[#6B6560] uppercase tracking-widest">
            Order · {cart.reduce((s, i) => s + i.qty, 0)} items
          </p>
        </div>

        <div className="divide-y divide-[#E0D9CE]">
          {cart.map(item => (
            <div key={item.id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1C1917] truncate">{item.name}</p>
                  {item.isQuick && (
                    <span className="text-[10px] bg-[#C84B2F]/15 text-[#C84B2F] px-1.5 py-0.5 rounded font-bold shrink-0">QUICK</span>
                  )}
                  {!item.isQuick && item.product?.type === 'service' && (
                    <span className="text-[10px] bg-purple-500/15 text-purple-600 px-1.5 py-0.5 rounded font-bold shrink-0">SVC</span>
                  )}
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 text-[#9B948E] active:text-red-500 shrink-0 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#EDE8DF] rounded-xl overflow-hidden shrink-0">
                  <button onClick={() => onUpdateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-[#6B6560] active:bg-[#D5CFC6]">
                    <Minus size={14} />
                  </button>

                  {/* Tappable qty — becomes input when editing */}
                  {editingQty === item.id ? (
                    <input
                      autoFocus
                      type="number"
                      inputMode="numeric"
                      value={qtyInput}
                      onChange={e => setQtyInput(e.target.value)}
                      onBlur={() => commitQty(item.id, item.qty)}
                      onKeyDown={e => e.key === 'Enter' && commitQty(item.id, item.qty)}
                      className="w-10 bg-white text-[#1C1917] font-bold text-sm text-center outline-none border-x border-[#D5CFC6] h-8"
                    />
                  ) : (
                    <button
                      onClick={() => startEditQty(item.id, item.qty)}
                      className="px-2 text-[#1C1917] font-bold text-sm min-w-[1.75rem] h-8 flex items-center justify-center active:bg-white/60"
                    >
                      {item.qty}
                    </button>
                  )}

                  <button
                    onClick={() => onUpdateQty(item.id, 1)}
                    disabled={
                      !item.isQuick &&
                      !!item.product &&
                      item.product.type !== 'service' &&
                      item.product.track_stock &&
                      item.qty >= item.product.stock
                    }
                    className="w-8 h-8 flex items-center justify-center text-[#6B6560] active:bg-[#D5CFC6] disabled:opacity-30"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="flex items-center bg-[#F5F0E8] border border-[#D5CFC6] rounded-xl px-2.5 py-1.5 flex-1 min-w-0">
                  <span className="text-[#9B948E] text-xs mr-1 shrink-0">Rs.</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={item.unitPrice}
                    onChange={e => onUpdatePrice(item.id, e.target.value)}
                    className="flex-1 bg-transparent text-[#1C1917] font-semibold text-sm outline-none min-w-0"
                  />
                </div>

                <p className="text-sm font-bold text-[#C84B2F] shrink-0 min-w-[4.5rem] text-right">
                  NPR {(item.qty * item.unitPrice).toLocaleString('ne-NP')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Discount row */}
      <div className="flex items-center gap-2 bg-white border border-[#D5CFC6] rounded-2xl px-4 py-3 shadow-sm">
        <Tag size={16} className="text-amber-500 shrink-0" />
        <span className="text-sm font-semibold text-amber-600 shrink-0">Discount</span>

        <input
          type="number"
          min="0"
          placeholder="0"
          value={discountPercent}
          onChange={e => onDiscountChange(e.target.value)}
          className="w-16 bg-amber-500/10 border border-amber-500/30 rounded-xl px-2 py-1.5 text-amber-700 font-bold text-base text-center outline-none"
        />

        {/* % / NPR toggle */}
        <div className="flex bg-amber-500/10 rounded-lg overflow-hidden border border-amber-500/20">
          <button
            onClick={() => onDiscountTypeChange('percent')}
            className={`px-2 py-1 text-xs font-bold transition-colors ${
              discountType === 'percent' ? 'bg-amber-500 text-white' : 'text-amber-600'
            }`}
          >
            %
          </button>
          <button
            onClick={() => onDiscountTypeChange('amount')}
            className={`px-2 py-1 text-xs font-bold transition-colors ${
              discountType === 'amount' ? 'bg-amber-500 text-white' : 'text-amber-600'
            }`}
          >
            NPR
          </button>
        </div>

        {discVal > 0 && (
          <p className="flex-1 text-right text-sm text-amber-600 font-semibold">
            − NPR {discountAmt.toLocaleString('ne-NP', { maximumFractionDigits: 0 })}
          </p>
        )}
      </div>
    </>
  )
}
