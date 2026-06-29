'use client'

import { useState } from 'react'
import { User, Calculator, X, Split, Tag, Search, UserPlus } from 'lucide-react'
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
  customers: Customer[]
  onPaymentMethodChange: (method: PaymentMethod) => void
  onCustomerNameChange: (value: string) => void
  onCashGivenChange: (value: string) => void
  onDiscountChange: (v: string) => void
  onDiscountTypeChange: (t: 'percent' | 'amount') => void
  onSelectCustomer: (c: Customer) => void
  onDeselectCustomer: () => void
  onCreateNewCustomer: (name: string) => Promise<void>
  onCharge: (split?: { method: PaymentMethod; amount: number }) => void
}

export default function CheckoutBar({
  cart, discountPercent, discountType, paymentMethod, customerName, cashGiven,
  submitting, selectedCustomer, customers,
  onPaymentMethodChange, onCustomerNameChange, onCashGivenChange,
  onDiscountChange, onDiscountTypeChange,
  onSelectCustomer, onDeselectCustomer, onCreateNewCustomer,
  onCharge,
}: Props) {
  const [splitEnabled,   setSplitEnabled]   = useState(false)
  const [splitMethod,    setSplitMethod]    = useState<PaymentMethod>('esewa')
  const [splitAmount,    setSplitAmount]    = useState('')
  const [showKhataList,  setShowKhataList]  = useState(false)
  const [creating,       setCreating]       = useState(false)

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

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerName.toLowerCase()) ||
    (c.phone ?? '').includes(customerName)
  )

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

  async function handleCreateKhata() {
    if (!customerName.trim()) return
    setCreating(true)
    await onCreateNewCustomer(customerName.trim())
    setCreating(false)
    setShowKhataList(false)
  }

  const SPLIT_METHODS = PAYMENT_METHODS.filter(p => p.value !== 'khata' && p.value !== paymentMethod)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#1C1917]">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-[76px] space-y-3">

        {/* Payment method grid — 3 cols × 2 rows */}
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map(pm => {
            const isActive = paymentMethod === pm.value
            return (
              <button
                key={pm.value}
                onClick={() => { onPaymentMethodChange(pm.value); setSplitEnabled(false) }}
                className={`rounded-2xl py-3.5 flex flex-col items-center gap-1.5 border transition-all active:scale-[0.96] ${
                  isActive
                    ? pm.value === 'khata'
                      ? 'bg-[#C9933A] border-[#C9933A] text-white'
                      : 'bg-white border-white text-[#1C1917]'
                    : 'bg-white/10 border-white/10 text-white/50'
                }`}
              >
                <span className="text-2xl leading-none">{pm.emoji}</span>
                <span className="text-xs font-bold">{pm.label}</span>
              </button>
            )
          })}

          {/* Split card */}
          {!isKhata && (
            <button
              onClick={() => setSplitEnabled(v => !v)}
              className={`rounded-2xl py-3.5 flex flex-col items-center gap-1.5 border transition-all active:scale-[0.96] ${
                splitEnabled
                  ? 'bg-purple-500 border-purple-500 text-white'
                  : 'bg-white/10 border-white/10 text-white/50'
              }`}
            >
              <Split size={22} />
              <span className="text-xs font-bold">Split</span>
            </button>
          )}
        </div>

        {/* Khata customer picker — inline in dark bar */}
        {isKhata && (
          <div className="relative">
            {selectedCustomer ? (
              <div className="flex items-center justify-between bg-[#C9933A]/20 border border-[#C9933A]/35 rounded-xl px-3 py-2.5">
                <div>
                  <p className="text-sm font-bold text-amber-300">{selectedCustomer.name}</p>
                  {Number(selectedCustomer.balance) > 0 && (
                    <p className="text-xs text-amber-400/70">
                      Outstanding: NPR {Number(selectedCustomer.balance).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
                <button
                  onClick={onDeselectCustomer}
                  className="text-white/50 bg-white/10 px-2.5 py-1 rounded-lg text-xs font-medium"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 bg-white/10 border border-[#C9933A]/40 rounded-xl px-3 py-2.5">
                  <Search size={15} className="text-amber-400/60 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search khata customer..."
                    value={customerName}
                    onChange={e => { onCustomerNameChange(e.target.value); setShowKhataList(true) }}
                    onFocus={() => setShowKhataList(true)}
                    className="flex-1 bg-transparent text-white placeholder:text-white/35 outline-none text-sm"
                  />
                  {customerName && (
                    <button onClick={() => { onCustomerNameChange(''); setShowKhataList(false) }}>
                      <X size={14} className="text-white/40" />
                    </button>
                  )}
                </div>

                {showKhataList && customerName && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#28231F] border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                    {filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { onSelectCustomer(c); onCustomerNameChange(''); setShowKhataList(false) }}
                        className="w-full flex items-center justify-between px-4 py-3 border-b border-white/8 last:border-0 text-left active:bg-white/10"
                      >
                        <span className="text-sm font-semibold text-white">{c.name}</span>
                        {Number(c.balance) > 0 && (
                          <span className="text-xs text-amber-400 ml-2 shrink-0">
                            NPR {Number(c.balance).toLocaleString('en-IN')}
                          </span>
                        )}
                      </button>
                    ))}
                    {customerName.trim() && (
                      <button
                        onClick={handleCreateKhata}
                        disabled={creating}
                        className="w-full flex items-center gap-2 px-4 py-3 text-left border-t border-white/10 active:bg-white/10"
                      >
                        <UserPlus size={14} className="text-green-400 shrink-0" />
                        <span className="text-sm text-green-400 font-medium">
                          {creating ? 'Creating...' : `Create "${customerName.trim()}"`}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Discount row */}
        <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-xl px-3 py-2.5">
          <Tag size={15} className="text-amber-400 shrink-0" />
          <span className="text-sm font-semibold text-white/70 shrink-0">Discount</span>
          <div className="flex items-center bg-white/15 rounded-xl overflow-hidden">
            <input
              type="number"
              min="0"
              placeholder="0"
              value={discountPercent}
              onChange={e => onDiscountChange(e.target.value)}
              className="w-14 bg-transparent text-white font-bold text-base text-center outline-none px-2 py-1.5"
            />
            <button
              onClick={() => onDiscountTypeChange(discountType === 'percent' ? 'amount' : 'percent')}
              className="bg-[#C84B2F] text-white text-xs font-bold px-3 py-2.5 shrink-0"
            >
              {discountType === 'percent' ? '%' : '₨'}
            </button>
          </div>
          {discountVal > 0 && (
            <p className="flex-1 text-right text-sm font-bold text-amber-400">
              − NPR {discountAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          )}
        </div>

        {/* Split row */}
        {splitEnabled && (
          <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-400 shrink-0">Split with</span>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {SPLIT_METHODS.map(pm => (
                  <button
                    key={pm.value}
                    onClick={() => setSplitMethod(pm.value)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold shrink-0 ${
                      splitMethod === pm.value
                        ? 'bg-purple-500 border-purple-500 text-white'
                        : 'bg-white/10 border-white/15 text-white/60'
                    }`}
                  >
                    <span>{pm.emoji}</span>
                    <span>{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50 shrink-0">
                {SPLIT_METHODS.find(p => p.value === splitMethod)?.label} amount
              </span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={splitAmount}
                onChange={e => setSplitAmount(e.target.value)}
                className="w-24 bg-white/15 border border-white/20 rounded-xl px-2 py-1.5 text-white font-bold text-sm outline-none text-center"
              />
              {splitAmt > 0 && splitAmt < total && (
                <span className="text-xs text-white/50">
                  {PAYMENT_METHODS.find(p => p.value === paymentMethod)?.label}: NPR {(total - splitAmt).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Customer name — non-khata optional */}
        {!isKhata && (
          <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2.5">
            <User size={15} className="text-white/40 shrink-0" />
            <input
              type="text"
              placeholder="Customer name (optional)"
              value={customerName}
              onChange={e => onCustomerNameChange(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder:text-white/35 outline-none text-sm"
            />
            {customerName && (
              <button onClick={() => onCustomerNameChange('')} className="text-white/40 shrink-0">
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Cash change calculator */}
        {isCash && !splitEnabled && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 flex-1 min-w-0">
              <Calculator size={15} className="text-white/40 shrink-0" />
              <span className="text-white/40 text-sm shrink-0">Received</span>
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
              <div className="bg-green-500/20 border border-green-500/25 rounded-xl px-4 py-1.5 text-center shrink-0">
                <p className="text-[10px] text-green-400/70 uppercase tracking-wide">Change</p>
                <p className="text-lg font-bold text-green-400 leading-tight">
                  NPR {change.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
            )}
            {cashGiven && change < 0 && (
              <div className="bg-red-500/20 border border-red-500/25 rounded-xl px-4 py-1.5 text-center shrink-0">
                <p className="text-[10px] text-red-400/70 uppercase tracking-wide">Short</p>
                <p className="text-lg font-bold text-red-400 leading-tight">
                  NPR {Math.abs(change).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Total + charge button */}
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            {discountVal > 0 && (
              <p className="text-xs text-white/30 line-through leading-none">
                NPR {subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            )}
            <p className="text-3xl font-black text-white leading-tight">
              NPR {total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
            {discountVal > 0 && (
              <p className="text-xs text-amber-400 leading-none">
                {discountType === 'amount' ? `NPR ${discountVal} off` : `${discountVal}% off`}
              </p>
            )}
            {splitEnabled && splitAmt > 0 && (
              <p className="text-[10px] text-purple-400 leading-none mt-0.5">
                {PAYMENT_METHODS.find(p => p.value === paymentMethod)?.label} {primaryAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })} + {SPLIT_METHODS.find(p => p.value === splitMethod)?.label} {splitAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            )}
          </div>

          <button
            onClick={handleCharge}
            disabled={isChargeDisabled}
            className="flex-1 py-4 rounded-2xl font-bold text-lg text-white active:scale-[0.98] transition-all disabled:opacity-40 bg-[#C84B2F]"
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
