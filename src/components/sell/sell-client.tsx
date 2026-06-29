'use client'

import { useState } from 'react'
import { Trash2, WifiOff, RefreshCw } from 'lucide-react'
import { formatBSFull } from '@/lib/utils/date'
import { useSell } from '@/hooks/use-sell'
import type { SaleResult } from '@/lib/types/app'

import ProductSearch   from '@/components/sell/product-search'
import ProductGrid     from '@/components/sell/product-grid'
import CartList        from '@/components/sell/cart-list'
import CheckoutBar     from '@/components/sell/checkout-bar'
import CustomItemSheet from '@/components/sell/custom-item-sheet'
import CustomerPicker  from '@/components/sell/customer-picker'
import SuccessScreen   from '@/components/sell/success-screen'

export default function SellClient() {
  const sell = useSell()

  const [search,           setSearch]           = useState('')
  const [showDropdown,     setShowDropdown]      = useState(false)
  const [showCustom,       setShowCustom]        = useState(false)
  const [customPrefill,    setCustomPrefill]     = useState('')
  const [showCustomerList, setShowCustomerList]  = useState(false)
  const [cashGiven,        setCashGiven]         = useState('')
  const [saleResult,       setSaleResult]        = useState<SaleResult | null>(null)

  const bsDate = formatBSFull(new Date())

  const filteredProducts = sell.products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  async function onCharge() {
    const result = await sell.handleSell()
    if (result) {
      setSaleResult(result)
      setCashGiven('')
    }
  }

  function onNewSale() {
    sell.clearCart()
    setSaleResult(null)
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

  const isCredit = sell.paymentMethod === 'khata'

  return (
    <div className={sell.cart.length > 0 ? 'pb-[380px]' : 'pb-0'}>

      {/* Sticky POS header — top-14 clears the fixed TopNav */}
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
            onSelect={sell.addToCart}
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
            discountPercent={sell.discountPercent}
            onUpdateQty={sell.updateQty}
            onUpdatePrice={sell.updatePrice}
            onRemoveItem={sell.removeItem}
            onDiscountChange={sell.setDiscountPercent}
          />
        )}

        {sell.cart.length > 0 && isCredit && (
          <CustomerPicker
            customers={sell.customers}
            customerSearch={sell.customerName}
            selectedCustomer={sell.selectedCustomer}
            showList={showCustomerList}
            onSearchChange={sell.setCustomerName}
            onShowList={setShowCustomerList}
            onSelect={sell.setSelectedCustomer}
            onDeselect={() => sell.setSelectedCustomer(null)}
            onCreateNew={sell.createAndSelectCustomer}
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
          discountPercent={sell.discountPercent}
          paymentMethod={sell.paymentMethod}
          customerName={sell.customerName}
          cashGiven={cashGiven}
          submitting={sell.submitting}
          selectedCustomer={sell.selectedCustomer}
          onPaymentMethodChange={m => {
            sell.setPaymentMethod(m)
            if (m !== 'khata') sell.setSelectedCustomer(null)
            setCashGiven('')
          }}
          onCustomerNameChange={sell.setCustomerName}
          onCashGivenChange={setCashGiven}
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
