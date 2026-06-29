'use client'

import { useState } from 'react'
import { X, Plus, Minus } from 'lucide-react'

interface Props {
  prefillName?: string
  onAdd: (name: string, price: number, qty: number) => void
  onClose: () => void
}

export default function CustomItemSheet({ prefillName = '', onAdd, onClose }: Props) {
  const [name,  setName]  = useState(prefillName)
  const [price, setPrice] = useState('')
  const [qty,   setQty]   = useState(1)

  function handleAdd() {
    const p = parseFloat(price)
    if (!name.trim() || !p || p <= 0) return
    onAdd(name.trim(), p, qty)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-[#D5CFC6] rounded-t-3xl px-6 pt-6 pb-12">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-[#1C1917]">Custom Item</h3>
          <button onClick={onClose} className="p-2 rounded-xl bg-[#EDE8DF] text-[#6B6560] active:scale-95">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Item name (e.g. Momo Set, Haircut, Rice...)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-[#F5F0E8] border border-[#D5CFC6] rounded-xl px-4 py-3 text-[#1C1917] placeholder:text-[#9B948E] outline-none text-base focus:ring-2 focus:ring-[#C84B2F]/30"
            autoFocus
          />

          <div className="flex gap-3">
            <div className="flex items-center bg-white border border-[#D5CFC6] rounded-xl px-3 py-3 flex-1">
              <span className="text-[#9B948E] text-sm mr-1 shrink-0">Rs.</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="flex-1 bg-transparent text-[#1C1917] font-bold text-xl outline-none min-w-0"
              />
            </div>

            <div className="flex items-center bg-[#EDE8DF] rounded-xl overflow-hidden shrink-0">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-3 text-[#6B6560] active:bg-[#D5CFC6]">
                <Minus size={16} />
              </button>
              <span className="px-3 text-[#1C1917] font-bold text-lg min-w-[2.5rem] text-center">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="px-3 py-3 text-[#6B6560] active:bg-[#D5CFC6]">
                <Plus size={16} />
              </button>
            </div>
          </div>

          {name && price && parseFloat(price) > 0 && (
            <p className="text-sm text-[#C84B2F] font-medium">
              = NPR {(parseFloat(price) * qty).toLocaleString('ne-NP')}
            </p>
          )}

          <button
            onClick={handleAdd}
            disabled={!name.trim() || !price || parseFloat(price) <= 0}
            className="w-full py-4 bg-[#C84B2F] rounded-2xl text-white font-bold text-lg active:scale-[0.98] disabled:opacity-40"
          >
            + Add to Order
          </button>
        </div>
      </div>
    </>
  )
}
