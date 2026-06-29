'use client'

import { useState } from 'react'
import { User, Calculator, X, Split } from 'lucide-react'
import type { PaymentMethod, Customer } from '@/lib/types/database'
import type { CartItem, PaymentMethodOption } from '@/lib/types/app'

const PAYMENT_METHODS: PaymentMethodOption[] = [
  { value: 'cash',    label: 'Cash',    emoji: '💵' },
  { value: 'khata',   label: 'Khata',   emoji: '📒' },
  { value: 'esewa',   label: 'eSewa',   emoji: '🟢' },
  { value: 'khalti',  label: 'Khalti',  emoji: '🟣' },
  { value: 'fonepay', label: 'FonePay', emoji: '📱' },
]

interface Props {
  cart: CartItem[]
  discountPercent: string
  discountType: 'percent' | 'amount'
  paymentMethod: PaymentMethod
  customerName: string
  cashGiven: string
  submitting: boolean
  selectedCustomer: Customer | null
  onPaymentMethodChange: (method: PaymentMethod) => void
  onCustomerNameChange: (value: string) => void
  onCashGivenChange: (value: string) => void
  onCharge: (split?: { method: PaymentMethod; amount: number }) => void
}

export default function CheckoutBar({
  cart, discountPercent, discountType, paymentMethod, customerName, cashGiven,
  submitting, selectedCustomer,
  onPaymentMethodChange, onCustomerNameChange, onCashGivenChange, onCharge,
}: Props) {
  const [splitEnabled, setSplitEnabled] = useState(false)
  const [splitMethod,  setSplitMethod]  = useState<PaymentMethod>('esewa')
  const [splitAmount,  setSplitAmount]  = useState('')

  const subtotal        = cart.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  const discountVal     = parseFloat(discountPercent) || 0
  const discountAmount  = discountType === 'amount' ? discountVal : subtotal * (discountVal / 100)
  const total           = subtotal - discountAmount
  const isCash          = paymentMethod === 'cash'
  const isKhata         = paymentMethod === 'khata'
  const cashGivenAmount = parseFloat(cashGiven) || 0
  const change          = cashGivenAmount - total

  const splitAmt        = parseFloat(splitAmount) || 0
  const primaryAmt      = splitEnabled ? total - splitAmt : total

  const isChargeDisabled =
    submitting || total <= 0 || (isKhata && !selectedCustomer) ||
    (splitEnabled && (splitAmt <= 0 || splitAmt >= total))

  function handleCharge() {
    if (splitEnabled && splitAmt > 0) {
      onCharge({ method: splitMethod, amount: splitAmt })
    } else {
      onCharge()
    }
  }

  const SPLIT_METHODS = PAYMENT_METHODS.filter(p => p.value !== 'khata' && p.value !== paymentMethod)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#D5CFC6]">
      <div className="max-w-2xl mx-auto px-4 pt-3 pb-[76px] space-y-3">

        {/* Payment method tabs + Split toggle */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {PAYMENT_METHODS.map(pm => (
            <button
              key={pm.value}
              onClick={() => { onPaymentMethodChange(pm.value); setSplitEnabled(false) }}
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

          {/* Split button — only when not khata */}
          {!isKhata && (
            <button
              onClick={() => setSplitEnabled(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border whitespace-nowrap shrink-0 transition-all active:scale-95 text-sm font-semibold ${
                splitEnabled
                  ? 'border-purple-500 bg-purple-500/10 text-purple-600'
                  : 'border-[#D5CFC6] text-[#9B948E]'
              }`}
            >
              <Split size={14} />
              <span>Split</span>
            </button>
          )}
        </div>

        {/* Split payment row */}
        {splitEnabled && (
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl px-3 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-600 shrink-0">Split with</span>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {SPLIT_METHODS.map(pm => (
                  <button
                    key={pm.value}
                    onClick={() => setSplitMethod(pm.value)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold shrink-0 ${
                      splitMethod === pm.value
                        ? 'border-purple-500 bg-purple-500/15 text-purple-600'
                        : 'border-[#D5CFC6] text-[#9B948E]'
                    }`}
                  >
                    <span>{pm.emoji}</span>
                    <span>{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-600 shrink-0">
                {SPLIT_METHODS.find(p => p.value === splitMethod)?.label} amount
              </span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={splitAmount}
                onChange={e => setSplitAmount(e.target.value)}
                className="w-24 bg-white border border-purple-500/30 rounded-lg px-2 py-1 text-purple-700 font-bold text-sm outline-none text-center"
              />
              {splitAmt > 0 && splitAmt < total && (
                <span className="text-xs text-[#9B948E]">
                  {PAYMENT_METHODS.find(p => p.value === paymentMethod)?.label}: NPR {(total - splitAmt).toLocaleString('ne-NP', { maximumFractionDigits: 0 })}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Optional customer name field */}
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
        {isCash && !splitEnabled && (
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
            {discountVal > 0 && (
              <p className="text-xs text-[#9B948E] line-through leading-none">
                NPR {subtotal.toLocaleString('ne-NP', { maximumFractionDigits: 0 })}
              </p>
            )}
            <p className="text-2xl font-black text-[#1C1917] leading-tight">
              NPR {total.toLocaleString('ne-NP', { maximumFractionDigits: 0 })}
            </p>
            {discountVal > 0 && (
              <p className="text-xs text-amber-600 leading-none">
                {discountType === 'amount' ? `NPR ${discountVal} off` : `${discountVal}% off`}
              </p>
            )}
            {splitEnabled && splitAmt > 0 && (
              <p className="text-xs text-purple-600 leading-none">
                {PAYMENT_METHODS.find(p => p.value === paymentMethod)?.label} NPR {primaryAmt.toLocaleString('ne-NP', { maximumFractionDigits: 0 })} + {SPLIT_METHODS.find(p => p.value === splitMethod)?.label} NPR {splitAmt.toLocaleString('ne-NP', { maximumFractionDigits: 0 })}
              </p>
            )}
          </div>

          <button
            onClick={handleCharge}
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
