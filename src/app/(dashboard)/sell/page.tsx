'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search, Plus, Minus, Trash2, Tag, User, CheckCircle, Zap, Package,
} from 'lucide-react'
import { formatBSFull } from '@/lib/bs-date'
import type { Product, Customer, PaymentMethod } from '@/types/database'

// A cart item can come from catalog (has product) or be a quick free-text item
interface CartItem {
  id: string          // product.id or generated key
  name: string
  unit: string
  product?: Product   // undefined for quick items
  qty: number
  unitPrice: number
  isQuick: boolean    // quick items skip stock update
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; emoji: string }[] = [
  { value: 'cash',    label: 'Cash',    emoji: '💵' },
  { value: 'bank',    label: 'Bank',    emoji: '🏦' },
  { value: 'esewa',   label: 'eSewa',   emoji: '🟢' },
  { value: 'khalti',  label: 'Khalti',  emoji: '🟣' },
  { value: 'fonepay', label: 'FonePay', emoji: '📱' },
  { value: 'credit',  label: 'Credit',  emoji: '📒' },
]

export default function SellPage() {
  const router = useRouter()

  const [bizId, setBizId]   = useState('')
  const [userId, setUserId] = useState('')

  const [products,  setProducts]  = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])

  // Mode: 'quick' = free-text, 'catalog' = product search
  const [sellMode, setSellMode] = useState<'quick' | 'catalog'>('quick')

  // Quick-add form
  const [quickName,  setQuickName]  = useState('')
  const [quickPrice, setQuickPrice] = useState('')
  const [quickQty,   setQuickQty]   = useState(1)

  // Catalog search
  const [search,          setSearch]          = useState('')
  const [showProductList, setShowProductList] = useState(false)

  // Cart
  const [cart, setCart] = useState<CartItem[]>([])

  // Customer (for credit)
  const [customerSearch,   setCustomerSearch]   = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerList, setShowCustomerList] = useState(false)

  // Sale
  const [discountPercent, setDiscountPercent] = useState('')
  const [paymentMethod,   setPaymentMethod]   = useState<PaymentMethod>('cash')

  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)
  const [error,      setError]      = useState('')
  const [doneTotal,  setDoneTotal]  = useState(0)

  const quickNameRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setUserId(user.id)

    const { data: biz } = await supabase
      .from('businesses').select('id').eq('owner_id', user.id).single()
    if (!biz) { setLoading(false); return }
    setBizId(biz.id)

    const [{ data: prods }, { data: custs }] = await Promise.all([
      supabase.from('products').select('*').eq('business_id', biz.id).eq('is_active', true).order('name'),
      supabase.from('customers').select('*').eq('business_id', biz.id).order('name'),
    ])

    setProducts((prods as Product[]) ?? [])
    setCustomers((custs as Customer[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Cart helpers ──
  const filteredProducts  = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone ?? '').includes(customerSearch)
  )

  function addQuickItem() {
    const name  = quickName.trim()
    const price = parseFloat(quickPrice)
    if (!name || !price || price <= 0) return
    const key = `quick-${Date.now()}-${Math.random()}`
    setCart(prev => [...prev, {
      id: key, name, unit: 'item', qty: quickQty, unitPrice: price, isQuick: true,
    }])
    setQuickName('')
    setQuickPrice('')
    setQuickQty(1)
    quickNameRef.current?.focus()
  }

  function addFromCatalog(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        return prev.map(i =>
          i.id === product.id
            ? { ...i, qty: Math.min(i.qty + 1, product.current_stock) }
            : i
        )
      }
      return [...prev, {
        id: product.id, name: product.name, unit: product.unit,
        product, qty: 1, unitPrice: Number(product.selling_price), isQuick: false,
      }]
    })
    setSearch('')
    setShowProductList(false)
  }

  function updateQty(itemId: string, delta: number) {
    setCart(prev =>
      prev.map(i => {
        if (i.id !== itemId) return i
        const newQty = i.qty + delta
        if (newQty <= 0) return null as unknown as CartItem
        if (!i.isQuick && i.product && newQty > i.product.current_stock) return i
        return { ...i, qty: newQty }
      }).filter(Boolean)
    )
  }

  function updatePrice(itemId: string, price: string) {
    setCart(prev =>
      prev.map(i => i.id === itemId ? { ...i, unitPrice: parseFloat(price) || 0 } : i)
    )
  }

  function removeItem(itemId: string) {
    setCart(prev => prev.filter(i => i.id !== itemId))
  }

  const subtotal    = cart.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const discPct     = parseFloat(discountPercent) || 0
  const discountAmt = subtotal * (discPct / 100)
  const total       = subtotal - discountAmt
  const isCredit    = paymentMethod === 'credit'

  // ── Submit ──
  async function handleSell() {
    if (cart.length === 0)                    { setError('Add at least one item'); return }
    if (isCredit && !selectedCustomer)         { setError('Select a customer for credit sale'); return }
    if (total <= 0)                            { setError('Total must be greater than 0'); return }

    setSubmitting(true)
    setError('')
    const supabase = createClient()
    const today    = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const bsDate   = formatBSFull(today)

    try {
      // 1. Sales transaction
      const { error: txErr } = await supabase.from('transactions').insert({
        business_id:      bizId,
        type:             'in',
        amount:           total,
        discount_percent: discPct,
        category:         'sales',
        description:      cart.map(i => `${i.name} x${i.qty}`).join(', '),
        payment_method:   paymentMethod,
        transaction_date: todayStr,
        created_by:       userId,
      })
      if (txErr) throw txErr

      // 2. Stock movements — catalog items only
      const catalogItems = cart.filter(i => !i.isQuick && i.product)
      if (catalogItems.length > 0) {
        const movements = catalogItems.map(i => ({
          business_id:  bizId,
          product_id:   i.product!.id,
          type:         'out' as const,
          quantity:     i.qty,
          unit_price:   i.unitPrice,
          total_price:  i.qty * i.unitPrice,
          notes:        `Sale — ${isCredit ? selectedCustomer!.name : paymentMethod}`,
          movement_date: todayStr,
          bs_date:      bsDate,
          created_by:   userId,
        }))
        const { error: mvErr } = await supabase.from('stock_movements').insert(movements)
        if (mvErr) throw mvErr

        for (const item of catalogItems) {
          await supabase.from('products').update({
            current_stock: item.product!.current_stock - item.qty,
            updated_at:    today.toISOString(),
          }).eq('id', item.product!.id)
        }
      }

      // 3. Khata entry if credit
      if (isCredit && selectedCustomer) {
        const { error: khErr } = await supabase.from('khata_entries').insert({
          business_id: bizId,
          customer_id: selectedCustomer.id,
          type:        'credit',
          amount:      total,
          description: cart.map(i => `${i.name} x${i.qty}`).join(', '),
          entry_date:  todayStr,
          bs_date:     bsDate,
          created_by:  userId,
        })
        if (khErr) throw khErr

        await supabase.from('customers').update({
          total_credit: Number(selectedCustomer.total_credit) + total,
          updated_at:   today.toISOString(),
        }).eq('id', selectedCustomer.id)
      }

      setDoneTotal(total)
      setDone(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save sale. Try again.')
      setSubmitting(false)
    }
  }

  function resetSale() {
    setCart([])
    setSelectedCustomer(null)
    setCustomerSearch('')
    setDiscountPercent('')
    setPaymentMethod('cash')
    setQuickName('')
    setQuickPrice('')
    setQuickQty(1)
    setDone(false)
    setSubmitting(false)
    setError('')
  }

  // ── SUCCESS ──
  if (done) {
    const hadCatalog = cart.some(i => !i.isQuick)
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={48} className="text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Sale Complete!</h1>
        <p className="text-5xl font-bold text-green-400 mb-3">
          NPR {doneTotal.toLocaleString('ne-NP', { maximumFractionDigits: 2 })}
        </p>
        <div className="space-y-1 text-sm text-gray-500 mb-3">
          {cart.map(i => (
            <p key={i.id}>{i.name} × {i.qty} — NPR {(i.qty * i.unitPrice).toLocaleString('ne-NP')}</p>
          ))}
        </div>
        {discPct > 0 && <p className="text-amber-400 text-sm mb-2">{discPct}% discount applied</p>}
        {isCredit && selectedCustomer && (
          <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
            <p className="text-amber-400 text-sm font-semibold">📒 Added to {selectedCustomer.name}'s Khata</p>
          </div>
        )}
        <p className="text-gray-600 text-xs mt-3 mb-8">
          Ledger saved{hadCatalog ? ' · Stock updated' : ''}{isCredit ? ' · Khata updated' : ''}
        </p>
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={resetSale}
            className="flex-1 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-bold text-lg active:scale-95"
          >
            New Sale
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 py-4 bg-white/10 border border-white/10 text-gray-300 rounded-2xl font-bold text-lg active:scale-95"
          >
            Home
          </button>
        </div>
      </div>
    )
  }

  // ── MAIN POS ──
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-36">

      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 z-20 px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-white">🛒 Sell</h1>
          {cart.length > 0 && (
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl px-3 py-1.5">
              <span className="text-orange-400 font-bold text-sm">{cart.length} item{cart.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Mode toggle */}
        <div className="flex bg-white/5 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setSellMode('quick')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
              sellMode === 'quick'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'text-gray-500'
            }`}
          >
            <Zap size={16} /> Quick Sell
          </button>
          <button
            onClick={() => setSellMode('catalog')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
              sellMode === 'catalog'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'text-gray-500'
            }`}
          >
            <Package size={16} /> Catalog
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* ── QUICK MODE ── */}
        {sellMode === 'quick' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Add any item — no catalog needed</p>

            <input
              ref={quickNameRef}
              type="text"
              placeholder="Item name (e.g. Momo Set, Haircut, Rice 1kg...)"
              value={quickName}
              onChange={e => setQuickName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && quickNameRef.current?.blur()}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-orange-500/50 text-base"
            />

            <div className="flex gap-3">
              {/* Price */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex-1">
                <span className="text-gray-500 text-sm mr-1 shrink-0">Rs.</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={quickPrice}
                  onChange={e => setQuickPrice(e.target.value)}
                  className="flex-1 bg-transparent text-white font-bold text-xl outline-none min-w-0"
                />
              </div>

              {/* Qty */}
              <div className="flex items-center bg-white/10 rounded-xl overflow-hidden shrink-0">
                <button onClick={() => setQuickQty(q => Math.max(1, q - 1))} className="px-3 py-3 text-gray-400 active:bg-white/10">
                  <Minus size={16} />
                </button>
                <span className="px-3 text-white font-bold text-lg min-w-[2.5rem] text-center">{quickQty}</span>
                <button onClick={() => setQuickQty(q => q + 1)} className="px-3 py-3 text-gray-400 active:bg-white/10">
                  <Plus size={16} />
                </button>
              </div>

              {/* Add button */}
              <button
                onClick={addQuickItem}
                disabled={!quickName.trim() || !quickPrice || parseFloat(quickPrice) <= 0}
                className="bg-orange-600 text-white px-4 rounded-xl font-bold text-sm active:scale-95 disabled:opacity-30 shrink-0"
              >
                Add
              </button>
            </div>

            {quickName && quickPrice && parseFloat(quickPrice) > 0 && (
              <p className="text-xs text-orange-400 font-medium">
                = NPR {(parseFloat(quickPrice) * quickQty).toLocaleString('ne-NP')}
              </p>
            )}
          </div>
        )}

        {/* ── CATALOG MODE ── */}
        {sellMode === 'catalog' && (
          <div className="relative">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <Search size={20} className="text-gray-500 shrink-0" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => { setSearch(e.target.value); setShowProductList(true) }}
                onFocus={() => setShowProductList(true)}
                className="flex-1 bg-transparent text-white placeholder:text-gray-600 outline-none text-base"
              />
            </div>

            {showProductList && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-30 max-h-64 overflow-y-auto">
                {loading ? (
                  <p className="text-center py-4 text-gray-500 text-sm">Loading...</p>
                ) : filteredProducts.length === 0 ? (
                  <p className="text-center py-4 text-gray-600 text-sm">No products found</p>
                ) : (
                  filteredProducts.map(p => {
                    const inCart    = cart.find(i => i.id === p.id)
                    const outOfStock = p.current_stock <= 0
                    return (
                      <button
                        key={p.id}
                        onClick={() => !outOfStock && addFromCatalog(p)}
                        disabled={outOfStock}
                        className={`w-full flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0 text-left active:bg-white/5 ${outOfStock ? 'opacity-40' : ''}`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{p.name}</p>
                          <p className="text-xs text-gray-500">
                            Stock: {p.current_stock} {p.unit}
                            {outOfStock && <span className="text-red-400 ml-1">Out of stock</span>}
                            {inCart && <span className="text-orange-400 ml-2">✓ in cart</span>}
                          </p>
                        </div>
                        <div className="text-right ml-3">
                          <p className="text-sm font-bold text-orange-400">NPR {Number(p.selling_price).toLocaleString('ne-NP')}</p>
                          <p className="text-xs text-gray-600">/{p.unit}</p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )}

        {showProductList && <div className="fixed inset-0 z-20" onClick={() => setShowProductList(false)} />}

        {/* ── CART ── */}
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-3">🛒</p>
            <p className="text-base font-semibold text-gray-500">
              {sellMode === 'quick' ? 'Type an item above to start selling' : 'Search products above to add them'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map(item => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-white truncate">{item.name}</p>
                      {item.isQuick && (
                        <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-semibold shrink-0">QUICK</span>
                      )}
                    </div>
                    {!item.isQuick && item.product && (
                      <p className="text-xs text-gray-500 mt-0.5">Stock: {item.product.current_stock} {item.product.unit}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-lg bg-white/5 text-gray-600 hover:text-red-400 active:scale-95"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  {/* Qty */}
                  <div className="flex items-center bg-white/10 rounded-xl overflow-hidden">
                    <button onClick={() => updateQty(item.id, -1)} className="px-3 py-2.5 text-gray-400 active:bg-white/10">
                      <Minus size={16} />
                    </button>
                    <span className="px-3 text-white font-bold text-lg min-w-[2.5rem] text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      disabled={!item.isQuick && !!item.product && item.qty >= item.product.current_stock}
                      className="px-3 py-2.5 text-gray-400 active:bg-white/10 disabled:opacity-30"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Unit price */}
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex-1">
                    <span className="text-gray-500 text-sm mr-1">Rs.</span>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={e => updatePrice(item.id, e.target.value)}
                      className="flex-1 bg-transparent text-white font-bold text-base outline-none w-0"
                    />
                    <span className="text-gray-600 text-xs">/{item.unit}</span>
                  </div>

                  {/* Line total */}
                  <p className="text-base font-bold text-orange-400 shrink-0 min-w-[5rem] text-right">
                    NPR {(item.qty * item.unitPrice).toLocaleString('ne-NP')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <>
            {/* Discount */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Tag size={16} className="text-amber-400" />
                <p className="text-sm font-semibold text-amber-400">Discount</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={discountPercent}
                  onChange={e => setDiscountPercent(e.target.value)}
                  className="w-20 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-amber-300 font-bold text-xl text-center outline-none"
                />
                <span className="text-amber-400 font-bold text-lg">%</span>
                {discPct > 0 && (
                  <p className="flex-1 text-right text-xs text-gray-500">
                    - NPR {discountAmt.toLocaleString('ne-NP', { maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-sm font-semibold text-gray-400 mb-3">Payment</p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(pm => (
                  <button
                    key={pm.value}
                    onClick={() => { setPaymentMethod(pm.value); if (pm.value !== 'credit') setSelectedCustomer(null) }}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all active:scale-95 ${
                      paymentMethod === pm.value
                        ? pm.value === 'credit'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-green-500 bg-green-500/10 text-green-400'
                        : 'border-white/10 text-gray-500'
                    }`}
                  >
                    <span className="text-lg">{pm.emoji}</span>
                    <span className="text-sm font-semibold">{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Customer picker (credit only) */}
            {isCredit && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User size={16} className="text-amber-400" />
                  <p className="text-sm font-semibold text-amber-400">Select Customer (for Khata) *</p>
                </div>

                {selectedCustomer ? (
                  <div className="flex items-center justify-between bg-amber-500/10 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-base font-bold text-white">{selectedCustomer.name}</p>
                      {selectedCustomer.phone && <p className="text-xs text-gray-500">📱 {selectedCustomer.phone}</p>}
                      <p className="text-xs text-amber-600 mt-0.5">
                        Outstanding: NPR {Math.max(0, Number(selectedCustomer.total_credit) - Number(selectedCustomer.total_paid)).toLocaleString('ne-NP')}
                      </p>
                    </div>
                    <button onClick={() => setSelectedCustomer(null)} className="text-xs text-gray-500 bg-white/10 px-3 py-1.5 rounded-lg">
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-3">
                      <Search size={16} className="text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search customer..."
                        value={customerSearch}
                        onChange={e => { setCustomerSearch(e.target.value); setShowCustomerList(true) }}
                        onFocus={() => setShowCustomerList(true)}
                        className="flex-1 bg-transparent text-white placeholder:text-gray-600 outline-none text-sm"
                      />
                    </div>
                    {showCustomerList && customerSearch && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto">
                        {filteredCustomers.length === 0 ? (
                          <p className="text-center py-3 text-gray-600 text-sm">No customers found</p>
                        ) : (
                          filteredCustomers.map(c => (
                            <button
                              key={c.id}
                              onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setShowCustomerList(false) }}
                              className="w-full flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 text-left"
                            >
                              <div>
                                <p className="text-sm font-semibold text-white">{c.name}</p>
                                {c.phone && <p className="text-xs text-gray-500">{c.phone}</p>}
                              </div>
                              <p className="text-xs text-amber-400 ml-2">
                                Due: NPR {Math.max(0, Number(c.total_credit) - Number(c.total_paid)).toLocaleString('ne-NP')}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Fixed bottom bar ── */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 px-4 pt-4 pb-8 z-20">
          <div className="flex items-center justify-between mb-3">
            <div>
              {discPct > 0 && (
                <p className="text-sm text-gray-500 line-through">NPR {subtotal.toLocaleString('ne-NP', { maximumFractionDigits: 2 })}</p>
              )}
              <p className="text-sm text-gray-400">
                {cart.reduce((s, i) => s + i.qty, 0)} items
                {discPct > 0 && <span className="text-amber-400 ml-2">{discPct}% off</span>}
              </p>
            </div>
            <p className="text-4xl font-bold text-white">
              NPR {total.toLocaleString('ne-NP', { maximumFractionDigits: 2 })}
            </p>
          </div>

          <button
            onClick={handleSell}
            disabled={submitting || cart.length === 0}
            className="w-full py-5 rounded-2xl font-bold text-xl text-white active:scale-[0.98] transition-all disabled:opacity-50 bg-gradient-to-r from-green-600 to-emerald-700"
          >
            {submitting ? 'Saving...' : (
              <>
                ✓ Sell · NPR {total.toLocaleString('ne-NP', { maximumFractionDigits: 2 })}
                <span className="ml-2 text-green-300 font-normal text-base">
                  {isCredit ? '📒 Khata' : PAYMENT_METHODS.find(p => p.value === paymentMethod)?.emoji}
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
