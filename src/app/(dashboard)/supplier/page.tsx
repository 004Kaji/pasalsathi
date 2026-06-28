'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, ChevronRight, Truck, TrendingDown } from 'lucide-react'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import type { Supplier, Plan } from '@/types/database'

function getBalanceColor(outstanding: number) {
  if (outstanding === 0) return { bg: 'bg-white/5', border: 'border-white/10', text: 'text-gray-400', badge: 'bg-white/10 text-gray-400' }
  if (outstanding < 10000) return { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', badge: 'bg-green-500/20 text-green-400' }
  if (outstanding < 50000) return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400' }
  return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', badge: 'bg-red-500/20 text-red-400' }
}

export default function SupplierPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<Plan>('sano')

  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: biz } = await supabase
      .from('businesses')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single()
    if (!biz) return
    setPlan(biz.plan as Plan)

    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('business_id', biz.id)
      .eq('is_active', true)
      .order('name')

    setSuppliers((data as Supplier[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchSuppliers() }, [fetchSuppliers])

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone ?? '').includes(search)
  )

  const totalOwed = suppliers.reduce(
    (sum, s) => sum + Math.max(0, Number(s.total_credit_taken) - Number(s.total_paid)), 0
  )

  const limit = PLAN_LIMITS[plan].suppliers
  const atLimit = limit !== Infinity && suppliers.length >= limit

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 z-10 px-4 pt-5 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">🏭 सप्लायर खाता</h1>
          {atLimit ? (
            <div className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
              सीमा पुग्यो ({limit})
            </div>
          ) : (
            <Link
              href="/supplier/new"
              className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2.5 rounded-xl font-semibold text-base active:scale-95 transition-transform"
            >
              <Plus size={20} /> थप्नुहोस्
            </Link>
          )}
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="सप्लायरको नाम वा फोन खोज्नुहोस्..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-orange-500/50"
          />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Truck size={16} className="text-blue-400" />
              <p className="text-sm font-medium text-blue-400">कुल सप्लायर</p>
            </div>
            <p className="text-2xl font-bold text-blue-300">{suppliers.length}</p>
            {limit !== Infinity && (
              <p className="text-xs text-blue-500 mt-0.5">/ {limit} सीमा</p>
            )}
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={16} className="text-red-400" />
              <p className="text-sm font-medium text-red-400">कुल तिर्न बाँकी</p>
            </div>
            <p className="text-xl font-bold text-red-300">
              NPR {totalOwed.toLocaleString('ne-NP')}
            </p>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">लोड हुँदैछ...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🏭</p>
            <p className="text-xl font-semibold text-gray-500">
              {search ? 'कुनै सप्लायर भेटिएन' : 'सप्लायर थपिएको छैन'}
            </p>
            {!search && (
              <p className="text-sm text-gray-600 mt-2">माथिको "+ थप्नुहोस्" थिच्नुहोस्</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(s => {
              const outstanding = Math.max(0, Number(s.total_credit_taken) - Number(s.total_paid))
              const colors = getBalanceColor(outstanding)
              return (
                <Link key={s.id} href={`/supplier/${s.id}`}>
                  <div className={`${colors.bg} border ${colors.border} rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="bg-white/10 rounded-full w-11 h-11 flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-lg">
                          {s.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-white truncate">{s.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {s.phone && <span className="text-xs text-gray-500">📱 {s.phone}</span>}
                          {s.product_categories && (
                            <span className="text-xs text-gray-600 truncate">{s.product_categories}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <div className="text-right">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colors.badge}`}>
                          {outstanding === 0 ? '✓ चुक्ता' : `NPR ${outstanding.toLocaleString('ne-NP')}`}
                        </span>
                        {outstanding > 0 && (
                          <p className="text-xs text-gray-600 mt-0.5 text-right">तिर्न बाँकी</p>
                        )}
                      </div>
                      <ChevronRight size={18} className="text-gray-600" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
