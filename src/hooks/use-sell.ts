'use client'
/**
 * use-sell.ts
 * POS sell hook — manages cart state and the full checkout submit flow.
 * All Supabase column names match 004_clean_schema.sql exactly.
 */

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/db/supabase'
import type { CartItem, SaleResult } from '@/lib/types/app'
import type { Product, Customer, PaymentMethod } from '@/lib/types/database'

interface SellState {
  bizId: string
  userId: string
  products: Product[]
  customers: Customer[]
  cart: CartItem[]
  paymentMethod: PaymentMethod
  discountPercent: string
  customerName: string
  selectedCustomer: Customer | null
  loading: boolean
  submitting: boolean
  error: string
  /** Add a catalog product to the cart (or increment qty if already in cart) */
  addToCart: (product: Product) => void
  /** Add a manually typed quick item that is not in the product catalog */
  addCustomItem: (name: string, price: number, qty: number) => void
  /** Increment (+1) or decrement (-1) a cart item quantity */
  updateQty: (itemId: string, delta: number) => void
  /** Override the unit price of a cart item */
  updatePrice: (itemId: string, price: string) => void
  /** Remove an item from the cart by id */
  removeItem: (itemId: string) => void
  /** Clear cart and reset all checkout state */
  clearCart: () => void
  setPaymentMethod: (method: PaymentMethod) => void
  setDiscountPercent: (value: string) => void
  setCustomerName: (value: string) => void
  setSelectedCustomer: (customer: Customer | null) => void
  /** Submit the sale — returns SaleResult on success, sets error string on failure */
  handleSell: () => Promise<SaleResult | null>
}

/** Full POS state and actions — drives the Sell page */
export function useSell(): SellState {
  const [bizId,     setBizId]     = useState('')
  const [userId,    setUserId]    = useState('')
  const [products,  setProducts]  = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart,      setCart]      = useState<CartItem[]>([])

  const [paymentMethod,    setPaymentMethod]    = useState<PaymentMethod>('cash')
  const [discountPercent,  setDiscountPercent]  = useState('')
  const [customerName,     setCustomerName]     = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  /** Fetch the current user's business, products, and customers */
  const fetchData = useCallback(async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setUserId(user.id)

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!business) { setLoading(false); return }
    setBizId(business.id)

    const [{ data: prods }, { data: custs }] = await Promise.all([
      supabase.from('products').select('*').eq('business_id', business.id).order('name'),
      supabase.from('customers').select('*').eq('business_id', business.id).order('name'),
    ])

    setProducts((prods as Product[]) ?? [])
    setCustomers((custs as Customer[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  /** Add a catalog product to cart. Blocks out-of-stock products. */
  function addToCart(product: Product) {
    const isService  = product.type === 'service'
    const isOutOfStock = !isService && product.track_stock && product.stock <= 0

    if (isOutOfStock) return

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        const wouldExceedStock = !isService && product.track_stock && existing.qty >= product.stock
        if (wouldExceedStock) return prev
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      }
      return [...prev, {
        id:        product.id,
        name:      product.name,
        unit:      product.unit,
        product,
        qty:       1,
        unitPrice: Number(product.price),
        isQuick:   false,
      }]
    })
  }

  /** Add a freeform quick item that is not in the product catalog */
  function addCustomItem(name: string, price: number, qty: number) {
    const uniqueKey = `quick-${Date.now()}-${Math.random()}`
    setCart(prev => [
      ...prev,
      { id: uniqueKey, name, unit: 'item', qty, unitPrice: price, isQuick: true },
    ])
  }

  /** Increment or decrement a cart item's quantity. Removes item if qty reaches 0. */
  function updateQty(itemId: string, delta: number) {
    setCart(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item

        const newQty = item.qty + delta
        if (newQty <= 0) return null as unknown as CartItem

        const isService = item.product?.type === 'service'
        const wouldExceedStock =
          !item.isQuick && !isService && item.product?.track_stock &&
          item.product && newQty > item.product.stock

        if (wouldExceedStock) return item
        return { ...item, qty: newQty }
      }).filter(Boolean)
    )
  }

  /** Override the unit price of a specific cart item */
  function updatePrice(itemId: string, price: string) {
    const parsedPrice = parseFloat(price) || 0
    setCart(prev =>
      prev.map(item => item.id === itemId ? { ...item, unitPrice: parsedPrice } : item)
    )
  }

  /** Remove a specific cart item */
  function removeItem(itemId: string) {
    setCart(prev => prev.filter(item => item.id !== itemId))
  }

  /** Reset cart and all checkout fields to initial state */
  function clearCart() {
    setCart([])
    setDiscountPercent('')
    setCustomerName('')
    setSelectedCustomer(null)
    setPaymentMethod('cash')
    setError('')
  }

  /** Submit the sale: insert transaction, decrement stock, create khata entry if credit */
  async function handleSell(): Promise<SaleResult | null> {
    const discountAmount  = parseFloat(discountPercent) || 0
    const subtotal        = cart.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
    const total           = subtotal - subtotal * (discountAmount / 100)
    const isKhataPayment  = paymentMethod === 'khata'
    const buyerName       = customerName.trim()
    const itemSummary     = cart.map(item => `${item.name} x${item.qty}`).join(', ')

    if (cart.length === 0)                  { setError('Add at least one item'); return null }
    if (isKhataPayment && !selectedCustomer) { setError('Select a customer for khata sale'); return null }
    if (total <= 0)                         { setError('Total must be greater than 0'); return null }

    setSubmitting(true)
    setError('')

    const supabase     = createClient()
    const displayName  = buyerName || (isKhataPayment ? selectedCustomer!.name : paymentMethod)

    try {
      // 1 — Insert the main transaction record
      const { error: transactionError } = await supabase.from('transactions').insert({
        business_id:    bizId,
        type:           'income',
        amount:         total,
        item_name:      buyerName ? `${buyerName} — ${itemSummary}` : itemSummary,
        payment_method: paymentMethod,
        customer_id:    selectedCustomer?.id ?? null,
      })
      if (transactionError) throw new Error(transactionError.message)

      // 2 — Decrement stock for each physical product sold
      const stockableItems = cart.filter(
        item => !item.isQuick && item.product?.type !== 'service' && item.product?.track_stock
      )

      for (const item of stockableItems) {
        if (!item.product) continue
        const newStock = Math.max(0, item.product.stock - item.qty)
        await supabase.from('products').update({ stock: newStock }).eq('id', item.product.id)
      }

      // 3 — Create khata ledger entry when payment method is khata (credit)
      if (isKhataPayment && selectedCustomer) {
        const { error: khataError } = await supabase.from('khata_entries').insert({
          business_id: bizId,
          customer_id: selectedCustomer.id,
          type:        'credit',
          amount:      total,
        })
        if (khataError) throw new Error(khataError.message)

        // Update the customer's running balance
        await supabase
          .from('customers')
          .update({ balance: Number(selectedCustomer.balance) + total })
          .eq('id', selectedCustomer.id)
      }

      setSubmitting(false)
      return {
        total,
        items:           cart,
        discountPercent: discountAmount,
        paymentMethod,
        customer:        selectedCustomer,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save sale. Try again.'
      setError(message)
      setSubmitting(false)
      return null
    }
  }

  return {
    bizId, userId, products, customers, cart, paymentMethod, discountPercent,
    customerName, selectedCustomer, loading, submitting, error,
    addToCart, addCustomItem, updateQty, updatePrice, removeItem, clearCart,
    setPaymentMethod, setDiscountPercent, setCustomerName, setSelectedCustomer,
    handleSell,
  }
}
