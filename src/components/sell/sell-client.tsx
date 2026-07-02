'use client'

import { useEffect, useState } from 'react'
import { Trash2, WifiOff, RefreshCw, PauseCircle, PlayCircle, Undo2 } from 'lucide-react'
import Link from 'next/link'
import { formatBSFull } from '@/lib/utils/date'
import { isStaffMode as checkStaffMode } from '@/lib/staff-mode'
import { useSell } from '@/hooks/use-sell'
import type { PaymentMethod } from '@/lib/types/database'
import type { SaleResult } from '@/lib/types/app'

import ProductSearch   from '@/components/sell/product-search'
import ProductGrid     from '@/components/sell/product-grid'
import CartList        from '@/components/sell/cart-list'
import CheckoutBar     from '@/components/sell/checkout-bar'
import CustomItemSheet from '@/components/sell/custom-item-sheet'
import SuccessScreen   from '@/components/sell/success-screen'

const HELD_CART_KEY = 'ps_held_cart'

export default function SellClient() {
  const sell = useSell()

  const [isStaffMode, setIsStaffMode] = useState(false)

  useEffect(() => {
    setIsStaffMode(checkStaffMode())
  }, [])

  const [search,           setSearch]           = useState('')
  const [showDropdown,     setShowDropdown]     = useState(false)
  const [showCustom,       setShowCustom]       = useState(false)
  const [customPrefill,    setCustomPrefill]    = useState('')
  const [cashGiven,        setCashGiven]        = useState('')
  const [saleResult,       setSaleResult]       = useState<SaleResult | null>(null)
  const [hasHeld,          setHasHeld]          = useState(false)
  const [checkoutExpanded, setCheckoutExpanded] = useState(false)

  const bsDate = formatBSFull(new Date())

  useEffect(() => {
    setHasHeld(!!localStorage.getItem(HELD_CART_KEY))
  }, [])

  const filteredProducts = sell.products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  async function onCharge(split?: { method: PaymentMethod; amount: number }) {
    const result = await sell.handleSell(split)
    if (result) {
      setSaleResult(result)
      setCashGiven('')
    }
  }

  function onNewSale() {
    sell.clearCart()
    setSaleResult(null)
  }

  function holdCart() {
    if (sell.cart.length === 0) return
    localStorage.setItem(HELD_CART_KEY, JSON.stringify(sell.cart))
    setHasHeld(true)
    sell.clearCart()
  }

  function resumeCart() {
    const stored = localStorage.getItem(HELD_CART_KEY)
    if (!stored) return
    sell.loadCart(JSON.parse(stored))
    localStorage.removeItem(HELD_CART_KEY)
    setHasHeld(false)
  }

  if (sell.loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-[#F5F0E8]">
        <p className="text-[#9B948E] text-lg">Loading POS...</p>
      </div>
    )
  }

  if (saleResult) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F5F0E8]">
        <SuccessScreen result={saleResult} onNewSale={onNewSale} />
      </div>
    )
  }

  return (
    <div className={sell.cart.length > 0 ? checkoutExpanded ? 'pb-[480px]' : 'pb-28' : 'pb-0'}>

      {/* Sticky POS header */}
      <div className="sticky top-14 bg-[#F5F0E8]/90 backdrop-blur-xl border-b border-[#D5CFC6] z-20 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1C1917]">🏪 POS</h2>
            <p className="text-xs text-[#9B948E] mt-0.5">{bsDate}</p>
          </div>
          <div className="flex items-center gap-2">
            {sell.pendingCount > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl px-2.5 py-1.5">
                {sell.syncing
                  ? <RefreshCw size={13} className="text-amber-500 animate-spin" />
                  : <WifiOff size={13} className="text-amber-500" />
                }
                <span className="text-amber-600 font-bold text-xs">
                  {sell.syncing ? 'Syncing...' : `${sell.pendingCount} offline`}
                </span>
              </div>
            )}

            {/* Return button — owner only: returns are the classic staff fraud vector */}
            {!isStaffMode && (
              <Link
                href="/sell/return"
                className="p-2.5 rounded-xl bg-[#EDE8DF] text-[#6B6560] active:scale-95 transition-transform"
              >
                <Undo2 size={16} />
              </Link>
            )}

            {/* Hold sale — visible when cart has items */}
            {sell.cart.length > 0 && (
              <button
                onClick={holdCart}
                className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 active:scale-95 transition-transform"
              >
                <PauseCircle size={18} />
              </button>
            )}

            {sell.cart.length > 0 && (
              <>
                <div className="bg-[#C84B2F]/10 border border-[#C84B2F]/20 rounded-xl px-3 py-1.5">
                  <span className="text-[#C84B2F] font-bold text-sm">
                    {sell.cart.reduce((s, i) => s + i.qty, 0)} items
                  </span>
                </div>
                <button
                  onClick={sell.clearCart}
                  className="p-2.5 rounded-xl bg-red-500/10 text-red-500 active:scale-95 transition-transform"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Resume held cart banner */}
        {hasHeld && sell.cart.length === 0 && (
          <button
            onClick={resumeCart}
            className="w-full flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3 active:scale-[0.98] transition-transform"
          >
            <PlayCircle size={20} className="text-blue-600 shrink-0" />
            <span className="text-blue-700 font-semibold text-sm">Resume held sale</span>
          </button>
        )}

        <ProductSearch
          search={search}
          filteredProducts={filteredProducts}
          showDropdown={showDropdown}
          onSearchChange={setSearch}
          onShowDropdown={setShowDropdown}
          onSelectProduct={p => { sell.addToCart(p); setSearch(''); setShowDropdown(false) }}
          onAddCustom={prefill => { setCustomPrefill(prefill); setShowCustom(true) }}
        />

        {!search && (
          <ProductGrid
            products={sell.products}
            cart={sell.cart}
            onSelect={p => { sell.addToCart(p); setCheckoutExpanded(false) }}
            onUpdateQty={sell.updateQty}
            onAddCustom={() => { setCustomPrefill(''); setShowCustom(true) }}
          />
        )}

        {!search && sell.products.length === 0 && (
          <p className="text-center py-8 text-[#9B948E] text-sm">
            No products yet — go to Products tab to add items.
          </p>
        )}

        {sell.cart.length > 0 && (
          <CartList
            cart={sell.cart}
            onUpdateQty={sell.updateQty}
            onUpdatePrice={sell.updatePrice}
            onRemoveItem={sell.removeItem}
          />
        )}

        {sell.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-red-500 text-sm font-medium">{sell.error}</p>
          </div>
        )}
      </div>

      {sell.cart.length > 0 && (
        <CheckoutBar
          cart={sell.cart}
          vatNumber={sell.vatNumber}
          discountPercent={sell.discountPercent}
          discountType={sell.discountType}
          paymentMethod={sell.paymentMethod}
          customerName={sell.customerName}
          cashGiven={cashGiven}
          submitting={sell.submitting}
          selectedCustomer={sell.selectedCustomer}
          customers={sell.customers}
          expanded={checkoutExpanded}
          onToggleExpanded={() => setCheckoutExpanded(v => !v)}
          onPaymentMethodChange={m => {
            sell.setPaymentMethod(m)
            if (m !== 'khata') sell.setSelectedCustomer(null)
            setCashGiven('')
          }}
          onCustomerNameChange={sell.setCustomerName}
          onCashGivenChange={setCashGiven}
          onDiscountChange={sell.setDiscountPercent}
          onDiscountTypeChange={sell.setDiscountType}
          onSelectCustomer={sell.setSelectedCustomer}
          onDeselectCustomer={() => sell.setSelectedCustomer(null)}
          onCreateNewCustomer={sell.createAndSelectCustomer}
          onCharge={onCharge}
        />
      )}

      {showCustom && (
        <CustomItemSheet
          prefillName={customPrefill}
          onAdd={sell.addCustomItem}
          onClose={() => setShowCustom(false)}
        />
      )}
    </div>
  )
}
