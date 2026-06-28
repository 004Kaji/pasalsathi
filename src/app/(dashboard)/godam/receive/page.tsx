'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search, Plus, Minus, Trash2, CheckCircle, Truck, Package,
} from 'lucide-react'
import { formatBSFull } from '@/lib/bs-date'
import type { Product, Supplier } from '@/types/database'

interface ReceiveItem {
  product: Product
  qty: number
  unitCost: number
}

const PAYMENT_OPTS = [
  { value: 'cash',    label: 'Cash',         emoji: '💵', isCredit: false },
  { value: 'bank',    label: 'Bank',          emoji: '🏦', isCredit: false },
  { value: 'esewa',   label: 'eSewa',         emoji: '🟢', isCredit: false },
  { value: 'fonepay', label: 'FonePay',       emoji: '📱', isCredit: false },
  { value: 'credit',  label: 'On Credit',     emoji: '📒', isCredit: true  },
]

export default function ReceiveStockPage() {
  const router = useRouter()

  const [bizId, setBizId]   = useState('')
  const [userId, setUserId] = useState('')

  const [products,  setProducts]  = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [items, setItems]         = useState<ReceiveItem[]>([])

  const [search,         setSearch]         = useState('')
  const [showProducts,   setShowProducts]   = useState(false)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [showSuppliers,  setShowSuppliers]  = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  const [payment, setPayment] = useState('cash')
  const [notes,   setNotes]   = useState('')

  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)
  const [error,      setError]      = useState('')

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: biz } = await supabase
      .from('businesses').select('id').eq('owner_id', user.id).single()
    if (!biz) return
    setBizId(biz.id)

    const [{ data: prods }, { data: supps }] = await Promise.all([
      supabase.from('products').select('*')
        .eq('business_id', biz.id).eq('is_active', true).order('name'),
      supabase.from('suppliers').select('*')
        .eq('business_id', biz.id).eq('is_active', true).order('name'),
    ])

    setProducts((prods as Product[]) ?? [])
    setSuppliers((supps as Supplier[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )
  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    (s.phone ?? '').includes(supplierSearch)
  )

  function addItem(product: Product) {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) return prev.map(i =>
        i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
      )
      return [...prev, { product, qty: 1, unitCost: Number(product.buying_price) }]
    })
    setSearch('')
    setShowProducts(false)
  }

  function updateQty(productId: string, delta: number) {
    setItems(prev =>
      prev.map(i => {
        if (i.product.id !== productId) return i
        const newQty = i.qty + delta
        if (newQty <= 0) return null as unknown as ReceiveItem
        return { ...i, qty: newQty }
      }).filter(Boolean)
    )
  }

  function updateCost(productId: string, cost: string) {
    setItems(prev =>
      prev.map(i =>
        i.product.id === productId ? { ...i, unitCost: parseFloat(cost) || 0 } : i
      )
    )
  }

  function removeItem(productId: string) {
    setItems(prev => prev.filter(i => i.product.id !== productId))
  }

  const total = items.reduce((sum, i) => sum + i.qty * i.unitCost, 0)
  const isCredit = PAYMENT_OPTS.find(p => p.value === payment)?.isCredit ?? false

  async function handleReceive() {
    if (items.length === 0) { setError('Add at least one product'); return }
    if (isCredit && !selectedSupplier) { setError('Select a supplier for credit purchase'); return }
    if (total <= 0) { setError('Total amount must be greater than 0'); return }

    setSubmitting(true)
    setError('')
    const supabase = createClient()
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const bsDate = formatBSFull(today)

    try {
      // 1. Stock movements (in) for each product
      const movements = items.map(i => ({
        business_id: bizId,
        product_id: i.product.id,
        type: 'in' as const,
        quantity: i.qty,
        unit_price: i.unitCost,
        total_price: i.qty * i.unitCost,
        supplier_name: selectedSupplier?.name ?? null,
        notes: notes.trim() || `Stock received${selectedSupplier ? ' from ' + selectedSupplier.name : ''}`,
        movement_date: todayStr,
        bs_date: bsDate,
        created_by: userId,
      }))

      const { error: mvErr } = await supabase.from('stock_movements').insert(movements)
      if (mvErr) throw mvErr

      // 2. Update current_stock for each product
      for (const item of items) {
        await supabase.from('products').update({
          current_stock: item.product.current_stock + item.qty,
          updated_at: today.toISOString(),
        }).eq('id', item.product.id)
      }

      // 3. Create Ledger transaction (purchase expense)
      const { error: txErr } = await supabase.from('transactions').insert({
        business_id: bizId,
        type: 'out',
        amount: total,
        discount_percent: 0,
        category: 'purchase',
        description: `Stock received — ${items.map(i => `${i.product.name} x${i.qty}`).join(', ')}${selectedSupplier ? ' from ' + selectedSupplier.name : ''}`,
        payment_method: isCredit ? 'credit' : payment,
        transaction_date: todayStr,
        created_by: userId,
      })
      if (txErr) throw txErr

      // 4. If credit → create supplier entry (credit_taken) + update supplier totals
      if (isCredit && selectedSupplier) {
        const { error: supErr } = await supabase.from('supplier_entries').insert({
          business_id: bizId,
          supplier_id: selectedSupplier.id,
          type: 'credit_taken',
          amount: total,
          description: items.map(i => `${i.product.name} x${i.qty}`).join(', '),
          bs_date: bsDate,
          entry_date: todayStr,
          created_by: userId,
        })
        if (supErr) throw supErr

        await supabase.from('suppliers').update({
          total_credit_taken: Number(selectedSupplier.total_credit_taken) + total,
          updated_at: today.toISOString(),
        }).eq('id', selectedSupplier.id)
      }

      setDone(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to receive stock. Please try again.')
      setSubmitting(false)
    }
  }

  function resetForm() {
    setItems([])
    setSelectedSupplier(null)
    setSupplierSearch('')
    setPayment('cash')
    setNotes('')
    setDone(false)
    setSubmitting(false)
    setError('')
  }

  // ── SUCCESS SCREEN ──
  if (done) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={48} className="text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Stock Received!</h1>
        <p className="text-5xl font-bold text-blue-400 mb-2">
          NPR {total.toLocaleString('ne-NP', { maximumFractionDigits: 2 })}
        </p>
        <div className="mt-3 space-y-1.5 text-sm text-gray-500 mb-2">
          {items.map(i => (
            <p key={i.product.id}>
              <span className="text-white font-semibold">{i.product.name}</span>
              {' '}+{i.qty} {i.product.unit} → now {i.product.current_stock + i.qty} {i.product.unit}
            </p>
          ))}
        </div>
        {isCredit && selectedSupplier && (
          <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
            <p className="text-amber-400 text-sm font-semibold">
              📒 Added to {selectedSupplier.name}'s supplier ledger
            </p>
          </div>
        )}
        <p className="text-gray-600 text-sm mt-4 mb-8">
          Stock updated · Ledger saved{isCredit ? ' · Supplier ledger updated' : ''}
        </p>
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={resetForm}
            className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-bold text-lg active:scale-95 transition-transform"
          >
            Receive More
          </button>
          <button
            onClick={() => router.push('/godam')}
            className="flex-1 py-4 bg-white/10 border border-white/10 text-gray-300 rounded-2xl font-bold text-lg active:scale-95 transition-transform"
          >
            Stock
          </button>
        </div>
      </div>
    )
  }

  // ── MAIN FORM ──
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-36">
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 z-20 px-4 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">📦 Receive Stock</h1>
            <p className="text-xs text-gray-500 mt-0.5">Updates stock · logs purchase · tracks supplier</p>
          </div>
          {items.length > 0 && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl px-3 py-1.5">
              <span className="text-blue-400 font-bold text-sm">{items.length} item{items.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Product search */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
            <Search size={20} className="text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Search product to add..."
              value={search}
              onChange={e => { setSearch(e.target.value); setShowProducts(true) }}
              onFocus={() => setShowProducts(true)}
              className="flex-1 bg-transparent text-white placeholder:text-gray-600 outline-none text-base"
            />
          </div>

          {showProducts && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-30 max-h-64 overflow-y-auto">
              {loading ? (
                <p className="text-center py-4 text-gray-500 text-sm">Loading...</p>
              ) : filteredProducts.length === 0 ? (
                <p className="text-center py-4 text-gray-600 text-sm">No products found</p>
              ) : (
                filteredProducts.map(p => {
                  const inList = items.find(i => i.product.id === p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => addItem(p)}
                      className="w-full flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0 text-left hover:bg-white/5 active:bg-white/5"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          Current stock: {p.current_stock} {p.unit}
                          {inList && <span className="text-blue-400 ml-2">✓ in list</span>}
                        </p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-sm font-bold text-gray-400">Cost: NPR {Number(p.buying_price).toLocaleString('ne-NP')}</p>
                        <p className="text-xs text-gray-600">/{p.unit}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        {showProducts && (
          <div className="fixed inset-0 z-20" onClick={() => setShowProducts(false)} />
        )}

        {/* Item list */}
        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-6xl mb-4">📦</p>
            <p className="text-lg font-semibold text-gray-500">No items added yet</p>
            <p className="text-sm text-gray-700 mt-1">Search for products above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.product.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-white truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Current: {item.product.current_stock} {item.product.unit}
                      <span className="text-blue-400 ml-2">→ after: {item.product.current_stock + item.qty} {item.product.unit}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="p-1.5 rounded-lg bg-white/5 text-gray-600 hover:text-red-400 active:scale-95"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  {/* Qty */}
                  <div className="flex items-center bg-white/10 rounded-xl overflow-hidden">
                    <button onClick={() => updateQty(item.product.id, -1)} className="px-3 py-2.5 text-gray-400 active:bg-white/10">
                      <Minus size={16} />
                    </button>
                    <span className="px-3 text-white font-bold text-lg min-w-[2.5rem] text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.product.id, 1)} className="px-3 py-2.5 text-gray-400 active:bg-white/10">
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Unit cost */}
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex-1">
                    <span className="text-gray-500 text-sm mr-1">Rs.</span>
                    <input
                      type="number"
                      value={item.unitCost}
                      onChange={e => updateCost(item.product.id, e.target.value)}
                      className="flex-1 bg-transparent text-white font-bold text-base outline-none w-0"
                    />
                    <span className="text-gray-600 text-xs">/{item.product.unit}</span>
                  </div>

                  {/* Line total */}
                  <p className="text-base font-bold text-blue-400 shrink-0 min-w-[5rem] text-right">
                    NPR {(item.qty * item.unitCost).toLocaleString('ne-NP')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <>
            {/* Supplier picker */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Truck size={16} className="text-gray-400" />
                <p className="text-sm font-semibold text-gray-400">Supplier <span className="text-gray-600 font-normal">(optional)</span></p>
              </div>

              {selectedSupplier ? (
                <div className="flex items-center justify-between bg-blue-500/10 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-base font-bold text-white">{selectedSupplier.name}</p>
                    {selectedSupplier.phone && <p className="text-xs text-gray-500">📱 {selectedSupplier.phone}</p>}
                    <p className="text-xs text-gray-600 mt-0.5">
                      Outstanding: NPR {Math.max(0, Number(selectedSupplier.total_credit_taken) - Number(selectedSupplier.total_paid)).toLocaleString('ne-NP')}
                    </p>
                  </div>
                  <button onClick={() => setSelectedSupplier(null)} className="text-xs text-gray-500 bg-white/10 px-3 py-1.5 rounded-lg">
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-3">
                    <Search size={16} className="text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search supplier..."
                      value={supplierSearch}
                      onChange={e => { setSupplierSearch(e.target.value); setShowSuppliers(true) }}
                      onFocus={() => setShowSuppliers(true)}
                      className="flex-1 bg-transparent text-white placeholder:text-gray-600 outline-none text-sm"
                    />
                  </div>
                  {showSuppliers && supplierSearch && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto">
                      {filteredSuppliers.length === 0 ? (
                        <p className="text-center py-3 text-gray-600 text-sm">No suppliers found</p>
                      ) : (
                        filteredSuppliers.map(s => (
                          <button
                            key={s.id}
                            onClick={() => { setSelectedSupplier(s); setSupplierSearch(''); setShowSuppliers(false) }}
                            className="w-full flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 text-left"
                          >
                            <div>
                              <p className="text-sm font-semibold text-white">{s.name}</p>
                              {s.phone && <p className="text-xs text-gray-500">{s.phone}</p>}
                            </div>
                            <p className="text-xs text-amber-400 ml-2">
                              Due: NPR {Math.max(0, Number(s.total_credit_taken) - Number(s.total_paid)).toLocaleString('ne-NP')}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment method */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-sm font-semibold text-gray-400 mb-3">Payment</p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_OPTS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setPayment(opt.value); if (!opt.isCredit) setSelectedSupplier(null) }}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                      payment === opt.value
                        ? opt.isCredit
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-white/10 text-gray-500'
                    }`}
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    <span className="text-sm font-semibold">{opt.label}</span>
                  </button>
                ))}
              </div>

              {isCredit && !selectedSupplier && (
                <p className="text-xs text-amber-500 mt-2">
                  ↑ Select a supplier above to track this in their ledger
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-sm font-semibold text-gray-400 mb-3">Notes <span className="text-gray-600 font-normal">(optional)</span></p>
              <input
                type="text"
                placeholder="e.g. Invoice #123, delivery note..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-blue-500/50 text-base"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Fixed bottom bar */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 px-4 pt-4 pb-8 z-20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-400">
                {items.reduce((s, i) => s + i.qty, 0)} units · {items.length} product{items.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-600">
                {isCredit
                  ? selectedSupplier ? `On credit from ${selectedSupplier.name}` : 'On credit (no supplier selected)'
                  : `Paid via ${PAYMENT_OPTS.find(p => p.value === payment)?.label}`
                }
              </p>
            </div>
            <p className="text-4xl font-bold text-white">
              NPR {total.toLocaleString('ne-NP', { maximumFractionDigits: 2 })}
            </p>
          </div>

          <button
            onClick={handleReceive}
            disabled={submitting || items.length === 0}
            className="w-full py-5 rounded-2xl font-bold text-xl text-white active:scale-[0.98] transition-all disabled:opacity-50 bg-gradient-to-r from-blue-600 to-indigo-700"
          >
            {submitting ? 'Saving...' : `✓ Confirm Stock Receipt · NPR ${total.toLocaleString('ne-NP', { maximumFractionDigits: 2 })}`}
          </button>
        </div>
      )}
    </div>
  )
}
