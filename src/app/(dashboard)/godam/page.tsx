'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, AlertTriangle, Package, ChevronRight, TrendingUp, Download, Wrench } from 'lucide-react'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import type { Product, Plan } from '@/types/database'

const UNIT_LABELS: Record<string, string> = {
  piece: 'Piece', kg: 'Kg', litre: 'Litre', box: 'Box', dozen: 'Dozen',
  session: 'Session', hour: 'Hr', service: 'Service',
}

export default function GodamPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'product' | 'service'>('product')
  const [filter, setFilter] = useState<'all' | 'low'>('all')
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<Plan>('sano')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: biz } = await supabase
      .from('businesses')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single()
    if (!biz) { setLoading(false); return }

    setPlan(biz.plan as Plan)

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', biz.id)
      .eq('is_active', true)
      .order('name')

    setProducts((data as Product[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // Products: item_type = 'product' or null (legacy)
  const physicalProducts = products.filter(p => p.item_type !== 'service')
  const services         = products.filter(p => p.item_type === 'service')

  const activeList = tab === 'product' ? physicalProducts : services

  const lowStockProducts = physicalProducts.filter(
    p => Number(p.current_stock) < Number(p.low_stock_threshold)
  )

  const filtered = activeList.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || Number(p.current_stock) < Number(p.low_stock_threshold)
    return matchSearch && (tab === 'service' ? matchSearch : matchFilter)
  })

  const totalValue = physicalProducts.reduce(
    (sum, p) => sum + Number(p.current_stock) * Number(p.buying_price), 0
  )

  const limit = PLAN_LIMITS[plan].products
  const atLimit = limit !== Infinity && products.length >= limit

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 z-10 px-4 pt-5 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">🏷️ Products</h1>
          <div className="flex gap-2">
            {tab === 'product' && (
              <Link
                href="/godam/receive"
                className="flex items-center gap-1.5 bg-blue-600/80 border border-blue-500/40 text-white px-3 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
              >
                <Download size={17} /> Restock
              </Link>
            )}
            {atLimit ? (
              <div className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
                Limit ({limit})
              </div>
            ) : (
              <Link
                href={`/godam/new?type=${tab}`}
                className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-red-600 text-white px-3 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
              >
                <Plus size={17} /> Add
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/5 rounded-2xl p-1 gap-1">
          <button
            onClick={() => { setTab('product'); setFilter('all') }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
              tab === 'product' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500'
            }`}
          >
            <Package size={16} /> Products
          </button>
          <button
            onClick={() => { setTab('service'); setFilter('all') }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
              tab === 'service' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500'
            }`}
          >
            <Wrench size={16} /> Services
          </button>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={tab === 'product' ? 'Search products...' : 'Search services...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-orange-500/50"
          />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Stats — Products tab only */}
        {tab === 'product' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Package size={18} className="text-blue-400" />
                <p className="text-sm font-medium text-blue-400">Products</p>
              </div>
              <p className="text-2xl font-bold text-blue-300">{physicalProducts.length}</p>
              {limit !== Infinity && (
                <p className="text-xs text-blue-500 mt-0.5">/ {limit} limit</p>
              )}
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={18} className="text-green-400" />
                <p className="text-sm font-medium text-green-400">Stock Value</p>
              </div>
              <p className="text-2xl font-bold text-green-300">
                NPR {totalValue.toLocaleString('ne-NP')}
              </p>
            </div>
          </div>
        )}

        {/* Services stat */}
        {tab === 'service' && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <Wrench size={18} className="text-purple-400" />
              <p className="text-sm font-medium text-purple-400">Services offered</p>
              <p className="text-2xl font-bold text-purple-300 ml-auto">{services.length}</p>
            </div>
            <p className="text-xs text-purple-500 mt-1">Services appear in Sell → Catalog. No stock tracking.</p>
          </div>
        )}

        {/* Low stock alert — products only */}
        {tab === 'product' && lowStockProducts.length > 0 && (
          <button
            onClick={() => setFilter(filter === 'low' ? 'all' : 'low')}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${
              filter === 'low'
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle size={22} />
              <div className="text-left">
                <p className="font-bold text-base">⚠️ {lowStockProducts.length} items low on stock!</p>
                <p className={`text-sm ${filter === 'low' ? 'text-red-100' : 'text-red-500'}`}>
                  {filter === 'low' ? 'Tap to show all' : 'Tap to view'}
                </p>
              </div>
            </div>
            <ChevronRight size={20} />
          </button>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500 text-lg">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">{tab === 'product' ? '📦' : '🛠️'}</p>
            <p className="text-xl font-semibold text-gray-500">
              {search ? 'No results found' : tab === 'product' ? 'No products yet' : 'No services yet'}
            </p>
            {!search && (
              <p className="text-base text-gray-600 mt-2">
                Tap "+ Add" to add a {tab === 'product' ? 'product' : 'service'}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {tab === 'product'
              ? filtered.map(p => <ProductCard key={p.id} product={p} />)
              : filtered.map(p => <ServiceCard key={p.id} product={p} />)
            }
          </div>
        )}
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const isLow = Number(product.current_stock) < Number(product.low_stock_threshold)
  const unit  = UNIT_LABELS[product.unit] ?? product.unit

  return (
    <Link href={`/godam/${product.id}`}>
      <div className={`rounded-2xl border p-4 flex items-center justify-between active:scale-[0.98] transition-transform ${
        isLow ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/10'
      }`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`rounded-xl p-2.5 shrink-0 ${isLow ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
            {isLow
              ? <AlertTriangle size={22} className="text-red-400" />
              : <Package size={22} className="text-blue-400" />
            }
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-white truncate">{product.name}</p>
            <p className="text-sm text-gray-500">
              💰 NPR {Number(product.selling_price).toLocaleString('ne-NP')}
            </p>
          </div>
        </div>
        <div className="text-right ml-3 shrink-0">
          <p className={`text-xl font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>
            {Number(product.current_stock).toLocaleString('ne-NP')}
          </p>
          <p className="text-xs text-gray-500">{unit}</p>
          {isLow && (
            <span className="text-xs font-semibold text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full mt-1 block">
              ⚠️ Low
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function ServiceCard({ product }: { product: Product }) {
  return (
    <Link href={`/godam/${product.id}`}>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="rounded-xl p-2.5 shrink-0 bg-purple-500/20">
            <Wrench size={22} className="text-purple-400" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-white truncate">{product.name}</p>
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-semibold">
              SERVICE
            </span>
          </div>
        </div>
        <div className="text-right ml-3 shrink-0">
          <p className="text-xl font-bold text-purple-300">
            NPR {Number(product.selling_price).toLocaleString('ne-NP')}
          </p>
          <p className="text-xs text-gray-500">per {UNIT_LABELS[product.unit] ?? product.unit}</p>
        </div>
      </div>
    </Link>
  )
}
