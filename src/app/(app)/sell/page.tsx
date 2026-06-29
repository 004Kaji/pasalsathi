'use client'
// POS sell page — thin orchestrator that wires useSell hook into sub-components
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { formatBSFull } from '@/lib/utils/date'
import { useSell } from '@/hooks/use-sell'
import type { SaleResult } from '@/lib/types/app'

import ProductSearch    from '@/components/sell/product-search'
import ProductGrid      from '@/components/sell/product-grid'
import CartList         from '@/components/sell/cart-list'
import CheckoutBar      from '@/components/sell/checkout-bar'
import CustomItemSheet  from '@/components/sell/custom-item-sheet'
import CustomerPicker   from '@/components/sell/customer-picker'
import SuccessScreen    from '@/components/sell/success-screen'

export default function SellPage() {
  const sell = useSell()

  // Local UI state for search/dropdown/custom-item sheet
  const [search,          setSearch]          = useState('')
  const [showDropdown,    setShowDropdown]     = useState(false)
  const [showCustom,      setShowCustom]       = useState(false)
  const [customPrefill,   setCustomPrefill]    = useState('')
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [cashGiven,       setCashGiven]        = useState('')

  // Post-sale result shown on success screen
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null)

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
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <p className="text-gray-500 text-lg">Loading POS...</p>
      </div>
    )
  }

  if (saleResult) {
    return <SuccessScreen result={saleResult} onNewSale={onNewSale} />
  }

  const isCredit = sell.paymentMethod === 'khata'

  return (
    <div className={`min-h-screen bg-[#0a0a0a] ${sell.cart.length > 0 ? 'pb-[380px]' : 'pb-24'}`}>

      {/* Sticky header */}
      <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 z-20 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">🏪 POS</h1>
            <p className="text-xs text-gray-600 mt-0.5">{bsDate}</p>
          </div>
          <div className="flex items-center gap-2">
            {sell.cart.length > 0 && (
              <>
                <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl px-3 py-1.5">
                  <span className="text-orange-400 font-bold text-sm">
                    {sell.cart.reduce((s, i) => s + i.qty, 0)} items
                  </span>
                </div>
                <button
                  onClick={sell.clearCart}
                  className="p-2.5 rounded-xl bg-red-500/10 text-red-400 active:scale-95 transition-transform"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Product search */}
        <ProductSearch
          search={search}
          filteredProducts={filteredProducts}
          showDropdown={showDropdown}
          onSearchChange={setSearch}
          onShowDropdown={setShowDropdown}
          onSelectProduct={p => { sell.addToCart(p); setSearch(''); setShowDropdown(false) }}
          onAddCustom={prefill => { setCustomPrefill(prefill); setShowCustom(true) }}
        />

        {/* Product grid — shown when not searching */}
        {!search && (
          <ProductGrid
            products={sell.products}
            cart={sell.cart}
            onSelect={sell.addToCart}
            onAddCustom={() => { setCustomPrefill(''); setShowCustom(true) }}
          />
        )}

        {!search && sell.products.length === 0 && (
          <p className="text-center py-8 text-gray-600 text-sm">
            No products yet — go to Products tab to add items.
          </p>
        )}

        {/* Cart + discount */}
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

        {/* Khata customer picker — credit only */}
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
          />
        )}

        {sell.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-red-400 text-sm font-medium">{sell.error}</p>
          </div>
        )}
      </div>

      {/* Fixed checkout bar */}
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

      {/* Custom item bottom sheet */}
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
