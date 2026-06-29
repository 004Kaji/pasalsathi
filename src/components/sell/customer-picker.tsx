'use client'
// Customer search for credit sales — lets cashier pick a Khata customer
import { Search } from 'lucide-react'
import type { Customer } from '@/lib/types/database'

interface Props {
  customers: Customer[]
  customerSearch: string
  selectedCustomer: Customer | null
  showList: boolean
  onSearchChange: (v: string) => void
  onShowList: (v: boolean) => void
  onSelect: (c: Customer) => void
  onDeselect: () => void
}

export default function CustomerPicker({
  customers, customerSearch, selectedCustomer, showList,
  onSearchChange, onShowList, onSelect, onDeselect,
}: Props) {
  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone ?? '').includes(customerSearch)
  )

  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
      <p className="text-sm font-semibold text-amber-400 mb-3">📒 Khata Customer *</p>

      {selectedCustomer ? (
        <div className="flex items-center justify-between bg-amber-500/10 rounded-xl px-4 py-3">
          <div>
            <p className="text-base font-bold text-white">{selectedCustomer.name}</p>
            {selectedCustomer.phone && <p className="text-xs text-gray-500">📱 {selectedCustomer.phone}</p>}
            <p className="text-xs text-amber-600 mt-0.5">
              Outstanding: NPR {Math.max(0, Number(selectedCustomer.balance)).toLocaleString('ne-NP')}
            </p>
          </div>
          <button onClick={onDeselect} className="text-xs text-gray-500 bg-white/10 px-3 py-1.5 rounded-lg">
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-3">
            <Search size={16} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search Khata customer..."
              value={customerSearch}
              onChange={e => { onSearchChange(e.target.value); onShowList(true) }}
              onFocus={() => onShowList(true)}
              className="flex-1 bg-transparent text-white placeholder:text-gray-600 outline-none text-sm"
            />
          </div>
          {showList && customerSearch && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-center py-3 text-gray-600 text-sm">No customers found</p>
              ) : (
                filtered.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { onSelect(c); onSearchChange(''); onShowList(false) }}
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0 text-left active:bg-white/5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{c.name}</p>
                      {c.phone && <p className="text-xs text-gray-500">{c.phone}</p>}
                    </div>
                    <p className="text-xs text-amber-400 ml-2">
                      Due: NPR {Math.max(0, Number(c.balance)).toLocaleString('ne-NP')}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
