'use client'
// Bottom sheet for adding a one-off custom item (not in catalog) to the cart
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
      <div className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-[#1a1a1a] border-t border-white/10 rounded-t-3xl px-6 pt-6 pb-12">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Custom Item</h3>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 text-gray-400 active:scale-95">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Item name (e.g. Momo Set, Haircut, Rice...)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none text-base"
            autoFocus
          />

          <div className="flex gap-3">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-3 flex-1">
              <span className="text-gray-500 text-sm mr-1 shrink-0">Rs.</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="flex-1 bg-transparent text-white font-bold text-xl outline-none min-w-0"
              />
            </div>

            <div className="flex items-center bg-white/10 rounded-xl overflow-hidden shrink-0">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-3 text-gray-400 active:bg-white/10">
                <Minus size={16} />
              </button>
              <span className="px-3 text-white font-bold text-lg min-w-[2.5rem] text-center">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="px-3 py-3 text-gray-400 active:bg-white/10">
                <Plus size={16} />
              </button>
            </div>
          </div>

          {name && price && parseFloat(price) > 0 && (
            <p className="text-sm text-orange-400 font-medium">
              = NPR {(parseFloat(price) * qty).toLocaleString('ne-NP')}
            </p>
          )}

          <button
            onClick={handleAdd}
            disabled={!name.trim() || !price || parseFloat(price) <= 0}
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl text-white font-bold text-lg active:scale-[0.98] disabled:opacity-40"
          >
            + Add to Order
          </button>
        </div>
      </div>
    </>
  )
}
