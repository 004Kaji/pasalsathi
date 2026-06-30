'use client'

import { X, Printer } from 'lucide-react'
import { formatBSFull } from '@/lib/utils/date'
import type { SaleResult } from '@/lib/types/app'

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', khata: 'Khata', esewa: 'eSewa', khalti: 'Khalti', fonepay: 'FonePay',
}

interface Props {
  result:       SaleResult
  businessName: string
  businessPhone: string | null
  businessAddress: string | null
  onClose:      () => void
}

export default function InvoiceSheet({ result, businessName, businessPhone, businessAddress, onClose }: Props) {
  const { total, subtotalBeforeVat, vatAmount, vatNumber, items, discountPercent, discountType, paymentMethod, customer, splitMethod, splitAmount } = result
  const fmt = (n: number) => `NPR ${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  const today = formatBSFull(new Date())

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="w-full max-h-[92vh] bg-white rounded-t-3xl overflow-y-auto">

        {/* Header bar */}
        <div className="sticky top-0 bg-white border-b border-[#E0D9CE] px-5 py-4 flex items-center justify-between">
          <p className="font-bold text-[#1C1917]">Invoice</p>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 text-sm text-[#6B6560] font-semibold active:opacity-70">
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full bg-[#F5F0E8] active:bg-[#EDE8DF]">
              <X size={18} className="text-[#6B6560]" />
            </button>
          </div>
        </div>

        {/* Invoice body */}
        <div id="invoice-print" className="px-6 py-6 space-y-5">

          {/* Business header */}
          <div className="text-center border-b border-dashed border-[#D5CFC6] pb-5">
            <p className="text-xl font-black text-[#1C1917]">{businessName}</p>
            {businessAddress && <p className="text-sm text-[#6B6560] mt-0.5">{businessAddress}</p>}
            {businessPhone && <p className="text-sm text-[#6B6560]">{businessPhone}</p>}
            {vatNumber && <p className="text-sm font-semibold text-[#1C1917] mt-1">VAT No: {vatNumber}</p>}
          </div>

          {/* Invoice meta */}
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-[#9B948E] text-xs">Date</p>
              <p className="font-semibold text-[#1C1917]">{today}</p>
            </div>
            <div className="text-right">
              <p className="text-[#9B948E] text-xs">Payment</p>
              <p className="font-semibold text-[#1C1917]">{METHOD_LABELS[paymentMethod]}</p>
            </div>
          </div>

          {customer && (
            <div className="bg-[#F5F0E8] rounded-xl px-4 py-3">
              <p className="text-xs text-[#9B948E]">Customer</p>
              <p className="font-semibold text-[#1C1917]">{customer.name}</p>
            </div>
          )}

          {/* Line items */}
          <div className="border border-[#D5CFC6] rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 text-xs font-bold text-[#9B948E] uppercase px-4 py-2 bg-[#F5F0E8] border-b border-[#D5CFC6]">
              <span className="col-span-6">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Rate</span>
              <span className="col-span-2 text-right">Amt</span>
            </div>
            {items.map(item => (
              <div key={item.id} className="grid grid-cols-12 text-sm px-4 py-3 border-b border-[#E0D9CE] last:border-0">
                <span className="col-span-6 font-medium text-[#1C1917] truncate">{item.name}</span>
                <span className="col-span-2 text-center text-[#6B6560]">{item.qty}</span>
                <span className="col-span-2 text-right text-[#6B6560]">{item.unitPrice.toLocaleString('en-IN')}</span>
                <span className="col-span-2 text-right font-semibold text-[#1C1917]">{(item.qty * item.unitPrice).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm border-t border-dashed border-[#D5CFC6] pt-4">
            {discountPercent > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Discount {discountType === 'percent' ? `(${discountPercent}%)` : ''}</span>
                <span>- {discountType === 'amount' ? fmt(discountPercent) : ''}</span>
              </div>
            )}
            {vatAmount > 0 && (
              <>
                <div className="flex justify-between text-[#6B6560]">
                  <span>Subtotal</span><span>{fmt(subtotalBeforeVat)}</span>
                </div>
                <div className="flex justify-between text-[#6B6560]">
                  <span>VAT 13%</span><span>{fmt(vatAmount)}</span>
                </div>
              </>
            )}
            {splitMethod && splitAmount && (
              <div className="flex justify-between text-purple-600 text-xs">
                <span>{METHOD_LABELS[paymentMethod]} + {METHOD_LABELS[splitMethod]}</span>
                <span>{fmt(total - splitAmount)} + {fmt(splitAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-lg text-[#1C1917] border-t border-[#D5CFC6] pt-2 mt-2">
              <span>Total</span><span>{fmt(total)}</span>
            </div>
          </div>

          <p className="text-center text-xs text-[#9B948E] pt-2">Thank you for your business! — PasalSathi</p>
        </div>
      </div>

      <style>{`@media print { body * { visibility: hidden; } #invoice-print, #invoice-print * { visibility: visible; } #invoice-print { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
    </div>
  )
}
