'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, WifiOff, MessageCircle, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/supabase'
import { isStaffMode } from '@/lib/staff-mode'
import InvoiceSheet from '@/components/sell/invoice-sheet'
import type { SaleResult } from '@/lib/types/app'

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', khata: 'Khata', esewa: 'eSewa', khalti: 'Khalti', fonepay: 'FonePay',
}

interface Props {
  result:    SaleResult
  onNewSale: () => void
}

export default function SuccessScreen({ result, onNewSale }: Props) {
  const router = useRouter()
  const { total, subtotalBeforeVat, vatAmount, vatNumber, items, discountPercent, discountType, paymentMethod, customer, offline, splitMethod, splitAmount } = result
  const hadCatalog = items.some(i => !i.isQuick)

  const [showInvoice, setShowInvoice] = useState(false)
  const [bizName,     setBizName]     = useState('')
  const [bizPhone,    setBizPhone]    = useState<string | null>(null)
  const [bizAddress,  setBizAddress]  = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) return
      createClient().from('businesses').select('name, phone, address').eq('owner_id', data.user.id).single()
        .then(({ data: biz }) => {
          if (biz) { setBizName(biz.name); setBizPhone(biz.phone); setBizAddress(biz.address) }
        })
    })
  }, [])

  function shareWhatsApp() {
    const fmt = (n: number) => `NPR ${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    const lines = [
      vatNumber ? `🧾 VAT Invoice — ${vatNumber}` : '🧾 Receipt',
      '',
      ...items.map(i => `${i.name} ×${i.qty}  ${fmt(i.qty * i.unitPrice)}`),
      '',
      discountPercent > 0
        ? `Discount: ${discountType === 'amount' ? `NPR ${discountPercent} off` : `${discountPercent}%`}`
        : '',
      vatAmount > 0
        ? `Subtotal: ${fmt(subtotalBeforeVat)}\nVAT 13%: ${fmt(vatAmount)}`
        : '',
      `Total: ${fmt(total)}`,
      splitMethod && splitAmount
        ? `(${METHOD_LABELS[paymentMethod]} ${fmt(total - splitAmount)} + ${METHOD_LABELS[splitMethod]} ${fmt(splitAmount)})`
        : `Payment: ${METHOD_LABELS[paymentMethod]}`,
    ].filter(l => l !== undefined && l !== null && l !== '').join('\n')

    window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col items-center justify-center px-6 text-center">

      {/* Icon */}
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
        offline ? 'bg-amber-500/20' : 'bg-[#4A7055]/15'
      }`}>
        {offline
          ? <WifiOff size={48} className="text-amber-500" />
          : <CheckCircle size={48} className="text-[#4A7055]" />
        }
      </div>

      <h1 className="text-3xl font-bold text-[#1C1917] mb-1">
        {offline ? 'Saved Offline' : 'Sale Complete!'}
      </h1>

      {offline && (
        <p className="text-sm text-amber-600 mb-3 max-w-xs">
          No internet right now. Sale is queued and will sync automatically when you&apos;re back online.
        </p>
      )}

      <p className={`text-5xl font-bold mb-3 ${offline ? 'text-amber-600' : 'text-[#4A7055]'}`}>
        NPR {total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </p>
      {vatAmount > 0 && (
        <div className="mb-2 text-sm text-blue-700 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2 text-left">
          <p className="font-semibold">VAT Invoice — {vatNumber}</p>
          <p>Subtotal: NPR {subtotalBeforeVat.toLocaleString('en-IN')}</p>
          <p>VAT 13%: NPR {vatAmount.toLocaleString('en-IN')}</p>
          <p className="font-bold">Total incl. VAT: NPR {total.toLocaleString('en-IN')}</p>
        </div>
      )}

      {/* Split info */}
      {splitMethod && splitAmount && (
        <p className="text-sm text-purple-600 mb-2 font-medium">
          {METHOD_LABELS[paymentMethod]} NPR {(total - splitAmount).toLocaleString()} + {METHOD_LABELS[splitMethod]} NPR {splitAmount.toLocaleString()}
        </p>
      )}

      <div className="space-y-1 text-sm text-[#6B6560] mb-3">
        {items.map(i => (
          <p key={i.id}>{i.name} × {i.qty} — NPR {(i.qty * i.unitPrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        ))}
      </div>

      {discountPercent > 0 && (
        <p className="text-amber-600 text-sm mb-2">
          {discountType === 'amount' ? `NPR ${discountPercent} discount` : `${discountPercent}% discount`} applied
        </p>
      )}

      {paymentMethod === 'khata' && customer && (
        <div className="mt-2 bg-[#C9933A]/10 border border-[#C9933A]/20 rounded-xl px-4 py-2">
          <p className="text-[#C9933A] text-sm font-semibold">
            📒 Added to {customer.name}&apos;s Khata
          </p>
        </div>
      )}

      <p className="text-[#9B948E] text-xs mt-3 mb-6">
        {offline
          ? '⏳ Will sync when online'
          : `Ledger saved${hadCatalog ? ' · Stock updated' : ''}${paymentMethod === 'khata' ? ' · Khata updated' : ''}`
        }
      </p>

      {/* Actions */}
      {!offline && (
        <div className="flex gap-3 mb-4">
          <button
            onClick={shareWhatsApp}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-700 font-semibold text-sm active:scale-95"
          >
            <MessageCircle size={16} />
            WhatsApp
          </button>
          <button
            onClick={() => setShowInvoice(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-700 font-semibold text-sm active:scale-95"
          >
            <FileText size={16} />
            Invoice
          </button>
        </div>
      )}

      {showInvoice && (
        <InvoiceSheet
          result={result}
          businessName={bizName}
          businessPhone={bizPhone}
          businessAddress={bizAddress}
          onClose={() => setShowInvoice(false)}
        />
      )}

      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={onNewSale}
          className="flex-1 py-4 bg-[#C84B2F] text-white rounded-2xl font-bold text-lg active:scale-95"
        >
          New Sale
        </button>
        {!isStaffMode() && (
          <button
            onClick={() => router.push('/home')}
            className="flex-1 py-4 bg-white border border-[#D5CFC6] text-[#6B6560] rounded-2xl font-bold text-lg active:scale-95"
          >
            Home
          </button>
        )}
      </div>
    </div>
  )
}
