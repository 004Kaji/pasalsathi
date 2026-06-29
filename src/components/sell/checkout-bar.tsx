'use client'
/**
 * checkout-bar.tsx
 * Fixed bottom bar: payment method tabs, optional cash-change calculator, charge button.
 * Payment methods match the `transactions.payment_method` check constraint exactly.
 */

import { User, Calculator, X } from 'lucide-react'
import type { PaymentMethod, Customer } from '@/lib/types/database'
import type { CartItem, PaymentMethodOption } from '@/lib/types/app'

/** The four payment methods allowed by the DB check constraint */
const PAYMENT_METHODS: PaymentMethodOption[] = [
  { value: 'cash',   label: 'Cash',   emoji: '💵' },
  { value: 'khata',  label: 'Khata',  emoji: '📒' },
  { value: 'esewa',  label: 'eSewa',  emoji: '🟢' },
  { value: 'khalti', label: 'Khalti', emoji: '🟣' },
]

interface Props {
  cart: CartItem[]
  discountPercent: string
  paymentMethod: PaymentMethod
  customerName: string
  cashGiven: string
  submitting: boolean
  selectedCustomer: Customer | null
  onPaymentMethodChange: (method: PaymentMethod) => void
  onCustomerNameChange: (value: string) => void
  onCashGivenChange: (value: string) => void
  onCharge: () => void
}

export default function CheckoutBar({
  cart, discountPercent, paymentMethod, customerName, cashGiven,
  submitting, selectedCustomer,
  onPaymentMethodChange, onCustomerNameChange, onCashGivenChange, onCharge,
}: Props) {
  const subtotal        = cart.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  const discountPct     = parseFloat(discountPercent) || 0
  const discountAmount  = subtotal * (discountPct / 100)
  const total           = subtotal - discountAmount
  const isCash          = paymentMethod === 'cash'
  const isKhata         = paymentMethod === 'khata'
  const cashGivenAmount = parseFloat(cashGiven) || 0
  const change          = cashGivenAmount - total

  /** Charge button is disabled when cart is empty or khata has no customer selected */
  const isChargeDisabled = submitting || total <= 0 || (isKhata && !selectedCustomer)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#0f0f0f] border-t border-white/10">
      <div className="max-w-2xl mx-auto px-4 pt-3 pb-[76px] space-y-3">

        {/* Payment method selector — 4 tabs */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {PAYMENT_METHODS.map(pm => (
            <button
              key={pm.value}
              onClick={() => onPaymentMethodChange(pm.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border whitespace-nowrap shrink-0 transition-all active:scale-95 text-sm font-semibold ${
                paymentMethod === pm.value
                  ? pm.value === 'khata'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-400'
                    : 'border-green-500 bg-green-500/15 text-green-400'
                  : 'border-white/10 text-gray-500'
              }`}
            >
              <span className="text-base">{pm.emoji}</span>
              <span>{pm.label}</span>
            </button>
          ))}
        </div>

        {/* Optional customer name field (for non-khata sales) */}
        {!isKhata && (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
            <User size={15} className="text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Customer name (optional)"
              value={customerName}
              onChange={e => onCustomerNameChange(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder:text-gray-600 outline-none text-sm"
            />
            {customerName && (
              <button onClick={() => onCustomerNameChange('')} className="text-gray-600 active:text-gray-400 shrink-0">
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Cash change calculator — only shown for cash payments */}
        {isCash && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex-1 min-w-0">
              <Calculator size={15} className="text-gray-500 shrink-0" />
              <span className="text-gray-500 text-sm shrink-0">Give Rs.</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder={String(Math.ceil(total / 100) * 100)}
                value={cashGiven}
                onChange={e => onCashGivenChange(e.target.value)}
                className="flex-1 bg-transparent text-white font-semibold text-base outline-none min-w-0"
              />
            </div>
            {cashGiven && change >= 0 && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-1.5 text-center shrink-0">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Change</p>
                <p className="text-lg font-bold text-green-400 leading-tight">
                  NPR {change.toLocaleString('ne-NP', { maximumFractionDigits: 0 })}
                </p>
              </div>
            )}
            {cashGiven && change < 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-1.5 text-center shrink-0">
                <p className="text-[10px] text-red-400 uppercase tracking-wide">Short</p>
                <p className="text-lg font-bold text-red-400 leading-tight">
                  NPR {Math.abs(change).toLocaleString('ne-NP', { maximumFractionDigits: 0 })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Total + charge button */}
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            {discountPct > 0 && (
              <p className="text-xs text-gray-600 line-through leading-none">
                NPR {subtotal.toLocaleString('ne-NP', { maximumFractionDigits: 0 })}
              </p>
            )}
            <p className="text-2xl font-black text-white leading-tight">
              NPR {total.toLocaleString('ne-NP', { maximumFractionDigits: 0 })}
            </p>
            {discountPct > 0 && (
              <p className="text-xs text-amber-400 leading-none">{discountPct}% off</p>
            )}
          </div>

          <button
            onClick={onCharge}
            disabled={isChargeDisabled}
            className="flex-1 py-4 rounded-2xl font-bold text-lg text-white active:scale-[0.98] transition-all disabled:opacity-50 bg-gradient-to-r from-green-600 to-emerald-700"
          >
            {submitting
              ? 'Saving...'
              : `✓ Charge ${PAYMENT_METHODS.find(p => p.value === paymentMethod)?.emoji}`
            }
          </button>
        </div>

      </div>
    </div>
  )
}
