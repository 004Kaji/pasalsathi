'use client'
/**
 * use-sell.ts
 * POS sell hook — manages cart state and the full checkout submit flow.
 * Supports offline queuing: if no internet, sale is saved to IndexedDB
 * and replayed automatically when the device reconnects.
 */

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/db/supabase'
import {
  queueSale, getPendingSales, removePendingSale, countPendingSales,
  type PendingSale,
} from '@/lib/offline-queue'
import type { CartItem, SaleResult } from '@/lib/types/app'
import type { Product, Customer, PaymentMethod } from '@/lib/types/database'

interface SellState {
  bizId:            string
  vatNumber:        string
  products:         Product[]
  customers:        Customer[]
  cart:             CartItem[]
  paymentMethod:    PaymentMethod
  discountPercent:  string
  discountType:     'percent' | 'amount'
  customerName:     string
  selectedCustomer: Customer | null
  pendingCount:     number
  loading:          boolean
  submitting:       boolean
  syncing:          boolean
  error:            string
  addToCart:               (product: Product) => void
  addCustomItem:           (name: string, price: number, qty: number) => void
  updateQty:               (itemId: string, delta: number) => void
  updatePrice:             (itemId: string, price: string) => void
  removeItem:              (itemId: string) => void
  clearCart:               () => void
  loadCart:                (items: CartItem[]) => void
  setPaymentMethod:        (method: PaymentMethod) => void
  setDiscountPercent:      (value: string) => void
  setDiscountType:         (type: 'percent' | 'amount') => void
  setCustomerName:         (value: string) => void
  setSelectedCustomer:     (customer: Customer | null) => void
  createAndSelectCustomer: (name: string) => Promise<void>
  handleSell:              (split?: { method: PaymentMethod; amount: number }) => Promise<SaleResult | null>
}

// ── shared DB submission (used for both online checkout and offline sync) ──────

async function submitPendingToDB(sale: PendingSale): Promise<void> {
  const supabase    = createClient()
  const itemSummary = sale.items.map(i => `${i.name} x${i.qty}`).join(', ')
  const displayName = sale.customerName || sale.selectedCustomer?.name || sale.paymentMethod

  const { error: txErr } = await supabase.from('transactions').insert({
    business_id:    sale.bizId,
    type:           'income',
    amount:         sale.total,
    item_name:      sale.customerName ? `${displayName} — ${itemSummary}` : itemSummary,
    payment_method: sale.paymentMethod,
    customer_id:    sale.selectedCustomer?.id ?? null,
  })
  if (txErr) throw new Error(txErr.message)

  const stockable = sale.items.filter(
    i => !i.isQuick && i.product?.type !== 'service' && i.product?.track_stock
  )
  for (const item of stockable) {
    if (!item.product) continue
    const { data: prod } = await supabase
      .from('products').select('stock').eq('id', item.product.id).single()
    if (!prod) continue
    const newStock = Math.max(0, Number(prod.stock) - item.qty)
    await supabase.from('products').update({ stock: newStock }).eq('id', item.product.id)
  }

  if (sale.paymentMethod === 'khata' && sale.selectedCustomer) {
    const { error: khErr } = await supabase.from('khata_entries').insert({
      business_id: sale.bizId,
      customer_id: sale.selectedCustomer.id,
      type:        'credit',
      amount:      sale.total,
    })
    if (khErr) throw new Error(khErr.message)

    await supabase
      .from('customers')
      .update({ balance: Number(sale.selectedCustomer.balance) + sale.total })
      .eq('id', sale.selectedCustomer.id)
  }
}

// ── hook ──────────────────────────────────────────────────────────────────────

export function useSell(): SellState {
  const [bizId,      setBizId]      = useState('')
  const [vatNumber,  setVatNumber]  = useState('')
  const [products,   setProducts]   = useState<Product[]>([])
  const [customers,  setCustomers]  = useState<Customer[]>([])
  const [cart,      setCart]      = useState<CartItem[]>([])

  const [paymentMethod,    setPaymentMethod]    = useState<PaymentMethod>('cash')
  const [discountPercent,  setDiscountPercent]  = useState('')
  const [discountType,     setDiscountType]     = useState<'percent' | 'amount'>('percent')
  const [customerName,     setCustomerName]     = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [pendingCount,     setPendingCount]     = useState(0)

  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [syncing,    setSyncing]    = useState(false)
  const [error,      setError]      = useState('')

  // ── initial data fetch ─────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: business } = await supabase
      .from('businesses').select('id, vat_number').eq('owner_id', user.id).single()
    if (!business) { setLoading(false); return }
    setBizId(business.id)
    setVatNumber((business as { id: string; vat_number: string | null }).vat_number ?? '')

    const [{ data: prods }, { data: custs }] = await Promise.all([
      supabase.from('products').select('*').eq('business_id', business.id).order('name'),
      supabase.from('customers').select('*').eq('business_id', business.id).order('name'),
    ])

    setProducts((prods as Product[]) ?? [])
    setCustomers((custs as Customer[]) ?? [])
    setLoading(false)

    const count = await countPendingSales().catch(() => 0)
    setPendingCount(count)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── sync pending sales when device comes back online ───────────────────────

  const runSync = useCallback(async () => {
    const pending = await getPendingSales().catch(() => [] as PendingSale[])
    if (pending.length === 0) return

    setSyncing(true)
    let synced = 0

    for (const sale of pending) {
      try {
        await submitPendingToDB(sale)
        await removePendingSale(sale.id)
        synced++
      } catch {
        // Leave in queue — will retry on next reconnect
      }
    }

    setSyncing(false)

    if (synced > 0) {
      const remaining = await countPendingSales().catch(() => 0)
      setPendingCount(remaining)
      fetchData()
    }
  }, [fetchData])

  useEffect(() => {
    window.addEventListener('online', runSync)
    return () => window.removeEventListener('online', runSync)
  }, [runSync])

  // ── cart operations ────────────────────────────────────────────────────────

  function addToCart(product: Product) {
    const isService    = product.type === 'service'
    const isOutOfStock = !isService && product.track_stock && product.stock <= 0
    if (isOutOfStock) return

    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        const wouldExceed = !isService && product.track_stock && existing.qty >= product.stock
        if (wouldExceed) return prev
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, {
        id: product.id, name: product.name, unit: product.unit,
        product, qty: 1, unitPrice: Number(product.price), isQuick: false,
      }]
    })
  }

  function addCustomItem(name: string, price: number, qty: number) {
    const key = `quick-${Date.now()}-${Math.random()}`
    setCart(prev => [...prev, { id: key, name, unit: 'item', qty, unitPrice: price, isQuick: true }])
  }

  function updateQty(itemId: string, delta: number) {
    setCart(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item
        const newQty = item.qty + delta
        if (newQty <= 0) return null as unknown as CartItem
        const isService   = item.product?.type === 'service'
        const wouldExceed =
          !item.isQuick && !isService && item.product?.track_stock &&
          item.product && newQty > item.product.stock
        if (wouldExceed) return item
        return { ...item, qty: newQty }
      }).filter(Boolean)
    )
  }

  function updatePrice(itemId: string, price: string) {
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, unitPrice: parseFloat(price) || 0 } : i))
  }

  function removeItem(itemId: string) {
    setCart(prev => prev.filter(i => i.id !== itemId))
  }

  function clearCart() {
    setCart([])
    setDiscountPercent('')
    setDiscountType('percent')
    setCustomerName('')
    setSelectedCustomer(null)
    setPaymentMethod('cash')
    setError('')
  }

  function loadCart(items: CartItem[]) {
    setCart(items)
  }

  // ── create a new khata customer inline and immediately select them ──────────

  async function createAndSelectCustomer(name: string): Promise<void> {
    if (!bizId || !name.trim()) return
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('customers')
      .insert({ business_id: bizId, name: name.trim(), balance: 0 })
      .select()
      .single()
    if (err || !data) return
    const created = data as Customer
    setCustomers(prev => [created, ...prev])
    setSelectedCustomer(created)
    setCustomerName('')
  }

  // ── checkout ───────────────────────────────────────────────────────────────

  async function handleSell(split?: { method: PaymentMethod; amount: number }): Promise<SaleResult | null> {
    const discountAmt      = parseFloat(discountPercent) || 0
    const subtotal         = cart.reduce((sum, i) => sum + i.qty * i.unitPrice, 0)
    const subtotalAfterDiscount = discountType === 'amount'
      ? subtotal - discountAmt
      : subtotal - subtotal * (discountAmt / 100)
    const vatAmount        = vatNumber ? Math.round(subtotalAfterDiscount * 0.13) : 0
    const total            = subtotalAfterDiscount + vatAmount
    const isKhata          = paymentMethod === 'khata'
    const itemSummary      = cart.map(i => `${i.name} x${i.qty}`).join(', ')

    if (cart.length === 0)            { setError('Add at least one item'); return null }
    if (isKhata && !selectedCustomer) { setError('Select a customer for khata sale'); return null }
    if (total <= 0)                   { setError('Total must be greater than 0'); return null }

    setSubmitting(true)
    setError('')

    // ── OFFLINE: queue in IndexedDB ──────────────────────────────────────────
    if (!navigator.onLine) {
      const pending: PendingSale = {
        id:               crypto.randomUUID(),
        bizId,
        total,
        itemSummary,
        items:            cart,
        paymentMethod,
        discountPercent:  discountAmt,
        selectedCustomer,
        customerName:     customerName.trim(),
        createdAt:        new Date().toISOString(),
      }
      await queueSale(pending).catch(() => {})
      setPendingCount(c => c + 1)
      setSubmitting(false)
      return {
        total, subtotalBeforeVat: subtotalAfterDiscount, vatAmount, vatNumber,
        items: cart, discountPercent: discountAmt, discountType,
        paymentMethod, customer: selectedCustomer,
        splitMethod: split?.method, splitAmount: split?.amount,
        offline: true,
      }
    }

    // ── ONLINE: submit directly ──────────────────────────────────────────────
    const supabase    = createClient()
    const displayName = customerName.trim() || (isKhata ? selectedCustomer!.name : paymentMethod)

    try {
      const { error: txErr } = await supabase.from('transactions').insert({
        business_id:    bizId,
        type:           'income',
        amount:         total,
        item_name:      customerName.trim() ? `${displayName} — ${itemSummary}` : itemSummary,
        payment_method: paymentMethod,
        customer_id:    selectedCustomer?.id ?? null,
      })
      if (txErr) throw new Error(txErr.message)

      const stockable = cart.filter(
        i => !i.isQuick && i.product?.type !== 'service' && i.product?.track_stock
      )
      for (const item of stockable) {
        if (!item.product) continue
        const newStock = Math.max(0, item.product.stock - item.qty)
        await supabase.from('products').update({ stock: newStock }).eq('id', item.product.id)
      }

      if (isKhata && selectedCustomer) {
        const { error: khErr } = await supabase.from('khata_entries').insert({
          business_id: bizId,
          customer_id: selectedCustomer.id,
          type:        'credit',
          amount:      total,
        })
        if (khErr) throw new Error(khErr.message)

        await supabase
          .from('customers')
          .update({ balance: Number(selectedCustomer.balance) + total })
          .eq('id', selectedCustomer.id)
      }

      setSubmitting(false)
      return {
        total, subtotalBeforeVat: subtotalAfterDiscount, vatAmount, vatNumber,
        items: cart, discountPercent: discountAmt, discountType,
        paymentMethod, customer: selectedCustomer,
        splitMethod: split?.method, splitAmount: split?.amount,
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save sale. Try again.')
      setSubmitting(false)
      return null
    }
  }

  return {
    bizId, vatNumber, products, customers, cart, paymentMethod, discountPercent, discountType,
    customerName, selectedCustomer, pendingCount, loading, submitting, syncing, error,
    addToCart, addCustomItem, updateQty, updatePrice, removeItem, clearCart, loadCart,
    setPaymentMethod, setDiscountPercent, setDiscountType, setCustomerName, setSelectedCustomer,
    createAndSelectCustomer, handleSell,
  }
}
