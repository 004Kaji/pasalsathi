'use client'
// Search bar + dropdown for finding catalog products in the POS
import { Search, X } from 'lucide-react'
import type { Product } from '@/lib/types/database'

interface Props {
  search: string
  filteredProducts: Product[]
  showDropdown: boolean
  onSearchChange: (v: string) => void
  onShowDropdown: (v: boolean) => void
  onSelectProduct: (p: Product) => void
  onAddCustom: (prefillName: string) => void
}

export default function ProductSearch({
  search, filteredProducts, showDropdown,
  onSearchChange, onShowDropdown, onSelectProduct, onAddCustom,
}: Props) {
  return (
    <div className="relative z-30">
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
        <Search size={20} className="text-gray-500 shrink-0" />
        <input
          type="text"
          placeholder="Search products & services..."
          value={search}
          onChange={e => { onSearchChange(e.target.value); onShowDropdown(true) }}
          onFocus={() => onShowDropdown(true)}
          className="flex-1 bg-transparent text-white placeholder:text-gray-600 outline-none text-base"
        />
        {search && (
          <button
            onClick={() => { onSearchChange(''); onShowDropdown(false) }}
            className="text-gray-500 active:text-gray-300 shrink-0"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {showDropdown && search && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="px-4 py-4">
              <p className="text-gray-600 text-sm mb-2">No matches for &quot;{search}&quot;</p>
              <button
                onClick={() => { onAddCustom(search); onSearchChange(''); onShowDropdown(false) }}
                className="text-sm text-orange-400 font-semibold active:opacity-70"
              >
                + Add as custom item →
              </button>
            </div>
          ) : (
            filteredProducts.map(p => {
              const isService  = p.type === 'service'
              const outOfStock = !isService && p.track_stock && p.stock <= 0
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProduct(p)}
                  disabled={outOfStock}
                  className={`w-full flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0 text-left active:bg-white/5 ${outOfStock ? 'opacity-40' : ''}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{p.name}</p>
                      {isService && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-bold">SVC</span>}
                      {outOfStock && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">OUT</span>}
                    </div>
                    <p className="text-xs text-gray-600">
                      {isService ? `per ${p.unit}` : `Stock: ${p.stock} ${p.unit}`}
                    </p>
                  </div>
                  <p className={`text-sm font-bold ml-3 shrink-0 ${isService ? 'text-purple-400' : 'text-orange-400'}`}>
                    NPR {Number(p.price).toLocaleString('ne-NP')}
                  </p>
                </button>
              )
            })
          )}
        </div>
      )}

      {showDropdown && search && (
        <div className="fixed inset-0 z-20" onClick={() => onShowDropdown(false)} />
      )}
    </div>
  )
}
