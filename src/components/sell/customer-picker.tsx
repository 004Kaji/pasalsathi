'use client'
// Customer search for credit sales — pick existing Khata customer or create new
import { useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import type { Customer } from '@/lib/types/database'

interface Props {
  customers:        Customer[]
  customerSearch:   string
  selectedCustomer: Customer | null
  showList:         boolean
  onSearchChange:   (v: string) => void
  onShowList:       (v: boolean) => void
  onSelect:         (c: Customer) => void
  onDeselect:       () => void
  onCreateNew:      (name: string) => Promise<void>
}

export default function CustomerPicker({
  customers, customerSearch, selectedCustomer, showList,
  onSearchChange, onShowList, onSelect, onDeselect, onCreateNew,
}: Props) {
  const [creating, setCreating] = useState(false)

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone ?? '').includes(customerSearch)
  )

  async function handleCreate() {
    if (!customerSearch.trim()) return
    setCreating(true)
    await onCreateNew(customerSearch.trim())
    setCreating(false)
    onShowList(false)
  }

  const showCreateOption = customerSearch.trim().length > 0 && filtered.length === 0

  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
      <p className="text-sm font-semibold text-amber-400 mb-3">📒 Khata Customer *</p>

      {selectedCustomer ? (
        <div className="flex items-center justify-between bg-amber-500/10 rounded-xl px-4 py-3">
          <div>
            <p className="text-base font-bold text-white">{selectedCustomer.name}</p>
            {selectedCustomer.phone && (
              <p className="text-xs text-gray-500">📱 {selectedCustomer.phone}</p>
            )}
            <p className="text-xs text-amber-600 mt-0.5">
              Outstanding: NPR {Math.max(0, Number(selectedCustomer.balance)).toLocaleString('ne-NP')}
            </p>
          </div>
          <button
            onClick={onDeselect}
            className="text-xs text-gray-500 bg-white/10 px-3 py-1.5 rounded-lg"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-3">
            <Search size={16} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search or type new customer name..."
              value={customerSearch}
              onChange={e => { onSearchChange(e.target.value); onShowList(true) }}
              onFocus={() => onShowList(true)}
              className="flex-1 bg-transparent text-white placeholder:text-gray-600 outline-none text-sm"
            />
          </div>

          {showList && customerSearch && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-30 overflow-hidden max-h-52 overflow-y-auto">
              {/* Existing customers */}
              {filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => { onSelect(c); onSearchChange(''); onShowList(false) }}
                  className="w-full flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0 text-left active:bg-white/5"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    {c.phone && <p className="text-xs text-gray-500">{c.phone}</p>}
                  </div>
                  <p className="text-xs text-amber-400 ml-2 shrink-0">
                    Due: NPR {Math.max(0, Number(c.balance)).toLocaleString('ne-NP')}
                  </p>
                </button>
              ))}

              {/* Create new — shown when no results match */}
              {showCreateOption && (
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-white/5"
                >
                  <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <UserPlus size={14} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-400">
                      {creating ? 'Creating...' : `Create "${customerSearch.trim()}"`}
                    </p>
                    <p className="text-xs text-gray-600">Add as new Khata customer</p>
                  </div>
                </button>
              )}

              {/* Create option even when partial matches exist */}
              {!showCreateOption && filtered.length > 0 && (
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left border-t border-white/10 active:bg-white/5"
                >
                  <UserPlus size={14} className="text-gray-500 shrink-0" />
                  <p className="text-xs text-gray-500">
                    {creating ? 'Creating...' : `+ Create "${customerSearch.trim()}" as new customer`}
                  </p>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
