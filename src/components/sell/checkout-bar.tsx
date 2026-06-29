'use client'

import { User, Calculator, X } from 'lucide-react'
import type { PaymentMethod, Customer } from '@/lib/types/database'
import type { CartItem, PaymentMethodOption } from '@/lib/types/app'

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

  const isChargeDisabled = submitting || total <= 0 || (isKhata && !selectedCustomer)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#D5CFC6]">
      <div className="max-w-2xl mx-auto px-4 pt-3 pb-[76px] space-y-3">

        {/* Payment method tabs */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {PAYMENT_METHODS.map(pm => (
            <button
              key={pm.value}
              onClick={() => onPaymentMethodChange(pm.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border whitespace-nowrap shrink-0 transition-all active:scale-95 text-sm font-semibold ${
                paymentMethod === pm.value
                  ? pm.value === 'khata'
                    ? 'border-[#C9933A] bg-[#C9933A]/15 text-[#C9933A]'
                    : 'border-[#4A7055] bg-[#4A7055]/10 text-[#4A7055]'
                  : 'border-[#D5CFC6] text-[#9B948E]'
              }`}
            >
              <span className="text-base">{pm.emoji}</span>
              <span>{pm.label}</span>
            </button>
          ))}
        </div>

        {/* Optional customer name field (for non-khata sales) */}
        {!isKhata && (
          <div className="flex items-center gap-2 bg-[#F5F0E8] border border-[#D5CFC6] rounded-xl px-3 py-2.5">
            <User size={15} className="text-[#9B948E] shrink-0" />
            <input
              type="text"
              placeholder="Customer name (optional)"
              value={customerName}
              onChange={e => onCustomerNameChange(e.target.value)}
              className="flex-1 bg-transparent text-[#1C1917] placeholder:text-[#9B948E] outline-none text-sm"
            />
            {customerName && (
              <button onClick={() => onCustomerNameChange('')} className="text-[#9B948E] active:text-[#6B6560] shrink-0">
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Cash change calculator */}
        {isCash && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#F5F0E8] border border-[#D5CFC6] rounded-xl px-3 py-2.5 flex-1 min-w-0">
              <Calculator size={15} className="text-[#9B948E] shrink-0" />
              <span className="text-[#9B948E] text-sm shrink-0">Give Rs.</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder={String(Math.ceil(total / 100) * 100)}
                value={cashGiven}
                onChange={e => onCashGivenChange(e.target.value)}
                className="flex-1 bg-transparent text-[#1C1917] font-semibold text-base outline-none min-w-0"
              />
            </div>
            {cashGiven && change >= 0 && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-1.5 text-center shrink-0">
                <p className="text-[10px] text-[#9B948E] uppercase tracking-wide">Change</p>
                <p className="text-lg font-bold text-[#4A7055] leading-tight">
                  NPR {change.toLocaleString('ne-NP', { maximumFractionDigits: 0 })}
                </p>
              </div>
            )}
            {cashGiven && change < 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-1.5 text-center shrink-0">
                <p className="text-[10px] text-red-500 uppercase tracking-wide">Short</p>
                <p className="text-lg font-bold text-red-500 leading-tight">
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
              <p className="text-xs text-[#9B948E] line-through leading-none">
                NPR {subtotal.toLocaleString('ne-NP', { maximumFractionDigits: 0 })}
              </p>
            )}
            <p className="text-2xl font-black text-[#1C1917] leading-tight">
              NPR {total.toLocaleString('ne-NP', { maximumFractionDigits: 0 })}
            </p>
            {discountPct > 0 && (
              <p className="text-xs text-amber-600 leading-none">{discountPct}% off</p>
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
