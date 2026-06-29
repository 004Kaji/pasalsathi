'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Papa from 'papaparse'
import { createClient } from '@/lib/db/supabase'
import { Plus, Search, AlertTriangle, Package, ChevronRight, TrendingUp, Download, Upload, FileDown, Wrench, X, CheckCircle, XCircle } from 'lucide-react'
import type { Product, ProductUnit, ProductType } from '@/lib/types/database'

// ── constants ─────────────────────────────────────────────────────────────────

const UNIT_LABELS: Record<string, string> = {
  piece: 'Piece', kg: 'Kg', litre: 'Litre', box: 'Box', dozen: 'Dozen',
}

const VALID_UNITS: ProductUnit[] = ['piece', 'kg', 'litre', 'box', 'dozen']
const VALID_TYPES: ProductType[] = ['product', 'service']

// ── CSV import types ──────────────────────────────────────────────────────────

interface ImportRow {
  rowNum:  number
  name:    string
  price:   string
  unit:    string
  type:    string
  stock:   string
  error:   string | null   // null = valid
}

// ── main component ────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products,    setProducts]    = useState<Product[]>([])
  const [search,      setSearch]      = useState('')
  const [tab,         setTab]         = useState<'product' | 'service'>('product')
  const [loading,     setLoading]     = useState(true)
  const [businessId,  setBusinessId]  = useState('')

  // CSV import state
  const [importRows,     setImportRows]     = useState<ImportRow[] | null>(null)
  const [importing,      setImporting]      = useState(false)
  const [importDone,     setImportDone]     = useState<{ ok: number; fail: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: biz } = await supabase
      .from('businesses').select('id').eq('owner_id', user.id).single()
    if (!biz) { setLoading(false); return }

    setBusinessId(biz.id)

    const { data } = await supabase
      .from('products').select('*').eq('business_id', biz.id).order('name')

    setProducts((data as Product[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // ── derived lists ──────────────────────────────────────────────────────────

  const physical  = products.filter(p => p.type !== 'service')
  const services  = products.filter(p => p.type === 'service')
  const activeList = tab === 'product' ? physical : services

  const filtered = activeList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalValue = physical.reduce(
    (sum, p) => sum + Number(p.stock) * Number(p.price), 0
  )

  // ── CSV export ─────────────────────────────────────────────────────────────

  function handleExportCSV() {
    const rows = [
      ['name', 'price', 'unit', 'type', 'stock'],
      ...products.map(p => [
        p.name,
        Number(p.price).toString(),
        p.unit,
        p.type,
        Number(p.stock).toString(),
      ]),
    ]
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'PasalSathi-Products.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── CSV import ─────────────────────────────────────────────────────────────

  function validateRow(raw: Record<string, string>, rowNum: number): ImportRow {
    const name  = (raw['name']  ?? '').trim()
    const price = (raw['price'] ?? '').trim()
    const unit  = (raw['unit']  ?? '').trim().toLowerCase() as ProductUnit
    const type  = (raw['type']  ?? '').trim().toLowerCase() as ProductType
    const stock = (raw['stock'] ?? '0').trim()

    if (!name)                        return { rowNum, name, price, unit, type, stock, error: 'Name is required' }
    if (!price || isNaN(Number(price)) || Number(price) < 0)
                                      return { rowNum, name, price, unit, type, stock, error: 'Price must be a positive number' }
    if (!VALID_UNITS.includes(unit))  return { rowNum, name, price, unit, type, stock, error: `Unit must be one of: ${VALID_UNITS.join(', ')}` }
    if (!VALID_TYPES.includes(type))  return { rowNum, name, price, unit, type, stock, error: 'Type must be "product" or "service"' }
    if (isNaN(Number(stock)) || Number(stock) < 0)
                                      return { rowNum, name, price, unit, type, stock, error: 'Stock must be 0 or more' }

    return { rowNum, name, price, unit, type, stock, error: null }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse<Record<string, string>>(file, {
      header:       true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data.map((raw, i) => validateRow(raw, i + 2))
        setImportRows(rows)
        setImportDone(null)
      },
    })

    // Reset so same file can be re-selected
    e.target.value = ''
  }

  async function handleConfirmImport() {
    if (!importRows || !businessId) return

    const valid = importRows.filter(r => r.error === null)
    if (valid.length === 0) return

    setImporting(true)
    const supabase = createClient()

    const inserts = valid.map(r => ({
      business_id: businessId,
      name:        r.name,
      price:       Number(r.price),
      unit:        r.unit as ProductUnit,
      type:        r.type as ProductType,
      stock:       Number(r.stock),
      track_stock: r.type !== 'service',
    }))

    const { error } = await supabase.from('products').insert(inserts)

    setImporting(false)

    if (!error) {
      setImportDone({ ok: valid.length, fail: importRows.length - valid.length })
      setImportRows(null)
      fetchProducts()
    }
  }

  const validCount   = importRows?.filter(r => !r.error).length ?? 0
  const invalidCount = importRows?.filter(r =>  r.error).length ?? 0

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="pb-10">

      {/* Sticky header */}
      <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 z-10 px-4 pt-5 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">🏷️ Products</h1>
          <Link
            href="/products/new"
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-red-600 text-white px-3 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
          >
            <Plus size={17} /> Add New
          </Link>
        </div>

        {/* Product / Service tab */}
        <div className="flex bg-white/5 rounded-2xl p-1 gap-1">
          {(['product', 'service'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
                tab === t
                  ? t === 'product' ? 'bg-orange-600 text-white' : 'bg-purple-600 text-white'
                  : 'text-gray-500'
              }`}
            >
              {t === 'product' ? <Package size={16} /> : <Wrench size={16} />}
              {t === 'product' ? 'Products' : 'Services'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={tab === 'product' ? 'Search products...' : 'Search services...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-orange-500/50"
          />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Stats */}
        {tab === 'product' ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Package size={16} className="text-blue-400" />
                <p className="text-sm font-medium text-blue-400">Products</p>
              </div>
              <p className="text-2xl font-bold text-blue-300">{physical.length}</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-green-400" />
                <p className="text-sm font-medium text-green-400">Stock Value</p>
              </div>
              <p className="text-xl font-bold text-green-300">
                NPR {totalValue.toLocaleString('ne-NP')}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench size={18} className="text-purple-400" />
              <p className="text-sm font-medium text-purple-400">Services offered</p>
            </div>
            <p className="text-2xl font-bold text-purple-300">{services.length}</p>
          </div>
        )}

        {/* Import success banner */}
        {importDone && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-green-400 font-medium">
              ✓ Imported {importDone.ok} products
              {importDone.fail > 0 && ` · ${importDone.fail} rows skipped`}
            </p>
            <button onClick={() => setImportDone(null)} className="text-green-600 hover:text-green-400">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Product list */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">{tab === 'product' ? '📦' : '🛠️'}</p>
            <p className="text-xl font-semibold text-gray-500">
              {search ? 'No results found' : tab === 'product' ? 'No products yet' : 'No services yet'}
            </p>
            {!search && (
              <p className="text-sm text-gray-600 mt-2">Tap "+ Add New" above</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(p =>
              tab === 'product'
                ? <ProductCard key={p.id} product={p} />
                : <ServiceCard key={p.id} product={p} />
            )}
          </div>
        )}

        {/* CSV buttons */}
        <div className="pt-2 grid grid-cols-2 gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-gray-300 font-semibold text-sm active:scale-[0.98] transition-transform hover:bg-white/10"
          >
            <Upload size={17} /> Import CSV
          </button>
          <button
            onClick={handleExportCSV}
            disabled={products.length === 0}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-gray-300 font-semibold text-sm active:scale-[0.98] transition-transform hover:bg-white/10 disabled:opacity-40"
          >
            <FileDown size={17} /> Export CSV
          </button>
        </div>

        {/* CSV format hint */}
        <p className="text-xs text-gray-600 text-center">
          CSV format: <span className="font-mono text-gray-500">name, price, unit, type, stock</span>
        </p>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Import preview modal */}
      {importRows && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm">
          <div className="w-full bg-[#111] border-t border-white/10 rounded-t-3xl max-h-[80vh] flex flex-col">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/10 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white">Import Preview</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  <span className="text-green-400 font-semibold">{validCount} valid</span>
                  {invalidCount > 0 && (
                    <span> · <span className="text-red-400 font-semibold">{invalidCount} errors</span></span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setImportRows(null)}
                className="p-2 rounded-xl bg-white/10 text-gray-400 hover:bg-white/20"
              >
                <X size={20} />
              </button>
            </div>

            {/* Row list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {importRows.map(row => (
                <div
                  key={row.rowNum}
                  className={`rounded-xl px-4 py-3 border text-sm ${
                    row.error
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-green-500/10 border-green-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {row.error
                          ? <XCircle size={14} className="text-red-400 shrink-0" />
                          : <CheckCircle size={14} className="text-green-400 shrink-0" />
                        }
                        <p className={`font-semibold truncate ${row.error ? 'text-red-300' : 'text-white'}`}>
                          {row.name || <span className="italic text-gray-500">(no name)</span>}
                        </p>
                      </div>
                      {!row.error && (
                        <p className="text-xs text-gray-500 mt-1 ml-5">
                          NPR {row.price} · {row.unit} · {row.type}
                          {row.type === 'product' && ` · stock: ${row.stock}`}
                        </p>
                      )}
                      {row.error && (
                        <p className="text-xs text-red-400 mt-1 ml-5">Row {row.rowNum}: {row.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="px-4 pb-6 pt-3 border-t border-white/10 shrink-0 space-y-2">
              {validCount > 0 && (
                <button
                  onClick={handleConfirmImport}
                  disabled={importing}
                  className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl text-white font-bold text-base active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {importing ? 'Importing...' : `Import ${validCount} Product${validCount !== 1 ? 's' : ''}`}
                </button>
              )}
              <button
                onClick={() => setImportRows(null)}
                className="w-full py-3.5 rounded-2xl border border-white/10 text-gray-400 font-semibold text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ── sub-components ────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const unit = UNIT_LABELS[product.unit] ?? product.unit

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="rounded-xl p-2.5 shrink-0 bg-blue-500/20">
            <Package size={22} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-white truncate">{product.name}</p>
            <p className="text-sm text-gray-500">NPR {Number(product.price).toLocaleString('ne-NP')} / {unit}</p>
          </div>
        </div>
        <div className="text-right ml-3 shrink-0 flex items-center gap-2">
          <div>
            <p className="text-xl font-bold text-white">{Number(product.stock).toLocaleString('ne-NP')}</p>
            <p className="text-xs text-gray-500">{unit}</p>
          </div>
          <ChevronRight size={18} className="text-gray-600" />
        </div>
      </div>
    </Link>
  )
}

function ServiceCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`}>
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
        <div className="text-right ml-3 shrink-0 flex items-center gap-2">
          <p className="text-xl font-bold text-purple-300">
            NPR {Number(product.price).toLocaleString('ne-NP')}
          </p>
          <ChevronRight size={18} className="text-gray-600" />
        </div>
      </div>
    </Link>
  )
}
