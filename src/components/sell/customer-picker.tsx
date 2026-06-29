'use client'

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
    <div className="bg-[#C9933A]/8 border border-[#C9933A]/20 rounded-2xl p-4">
      <p className="text-sm font-semibold text-[#C9933A] mb-3">📒 Khata Customer *</p>

      {selectedCustomer ? (
        <div className="flex items-center justify-between bg-[#C9933A]/10 rounded-xl px-4 py-3">
          <div>
            <p className="text-base font-bold text-[#1C1917]">{selectedCustomer.name}</p>
            {selectedCustomer.phone && (
              <p className="text-xs text-[#6B6560]">📱 {selectedCustomer.phone}</p>
            )}
            <p className="text-xs text-[#C9933A] mt-0.5">
              Outstanding: NPR {Math.max(0, Number(selectedCustomer.balance)).toLocaleString('ne-NP')}
            </p>
          </div>
          <button
            onClick={onDeselect}
            className="text-xs text-[#6B6560] bg-[#EDE8DF] px-3 py-1.5 rounded-lg"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-center gap-2 bg-[#F5F0E8] border border-[#D5CFC6] rounded-xl px-3 py-3">
            <Search size={16} className="text-[#9B948E]" />
            <input
              type="text"
              placeholder="Search or type new customer name..."
              value={customerSearch}
              onChange={e => { onSearchChange(e.target.value); onShowList(true) }}
              onFocus={() => onShowList(true)}
              className="flex-1 bg-transparent text-[#1C1917] placeholder:text-[#9B948E] outline-none text-sm"
            />
          </div>

          {showList && customerSearch && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#D5CFC6] rounded-xl shadow-xl z-30 overflow-hidden max-h-52 overflow-y-auto">
              {/* Existing customers */}
              {filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => { onSelect(c); onSearchChange(''); onShowList(false) }}
                  className="w-full flex items-center justify-between px-4 py-3 border-b border-[#E0D9CE] last:border-0 text-left active:bg-[#F5F0E8]"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1C1917]">{c.name}</p>
                    {c.phone && <p className="text-xs text-[#9B948E]">{c.phone}</p>}
                  </div>
                  <p className="text-xs text-[#C9933A] ml-2 shrink-0">
                    Due: NPR {Math.max(0, Number(c.balance)).toLocaleString('ne-NP')}
                  </p>
                </button>
              ))}

              {/* Create new — shown when no results match */}
              {showCreateOption && (
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-[#F5F0E8]"
                >
                  <div className="w-7 h-7 rounded-full bg-[#4A7055]/15 flex items-center justify-center shrink-0">
                    <UserPlus size={14} className="text-[#4A7055]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#4A7055]">
                      {creating ? 'Creating...' : `Create "${customerSearch.trim()}"`}
                    </p>
                    <p className="text-xs text-[#9B948E]">Add as new Khata customer</p>
                  </div>
                </button>
              )}

              {/* Create option even when partial matches exist */}
              {!showCreateOption && filtered.length > 0 && (
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left border-t border-[#E0D9CE] active:bg-[#F5F0E8]"
                >
                  <UserPlus size={14} className="text-[#9B948E] shrink-0" />
                  <p className="text-xs text-[#9B948E]">
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
