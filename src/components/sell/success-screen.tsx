'use client'

import { CheckCircle, WifiOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { SaleResult } from '@/lib/types/app'

interface Props {
  result:    SaleResult
  onNewSale: () => void
}

export default function SuccessScreen({ result, onNewSale }: Props) {
  const router = useRouter()
  const { total, items, discountPercent, paymentMethod, customer, offline } = result
  const hadCatalog = items.some(i => !i.isQuick)

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

      {/* Title */}
      <h1 className="text-3xl font-bold text-[#1C1917] mb-1">
        {offline ? 'Saved Offline' : 'Sale Complete!'}
      </h1>

      {/* Offline notice */}
      {offline && (
        <p className="text-sm text-amber-600 mb-3 max-w-xs">
          No internet right now. Sale is queued and will sync automatically when you&apos;re back online.
        </p>
      )}

      {/* Total */}
      <p className={`text-5xl font-bold mb-3 ${offline ? 'text-amber-600' : 'text-[#4A7055]'}`}>
        NPR {total.toLocaleString('ne-NP', { maximumFractionDigits: 2 })}
      </p>

      {/* Items */}
      <div className="space-y-1 text-sm text-[#6B6560] mb-3">
        {items.map(i => (
          <p key={i.id}>{i.name} × {i.qty} — NPR {(i.qty * i.unitPrice).toLocaleString('ne-NP')}</p>
        ))}
      </div>

      {discountPercent > 0 && (
        <p className="text-amber-600 text-sm mb-2">{discountPercent}% discount applied</p>
      )}

      {paymentMethod === 'khata' && customer && (
        <div className="mt-2 bg-[#C9933A]/10 border border-[#C9933A]/20 rounded-xl px-4 py-2">
          <p className="text-[#C9933A] text-sm font-semibold">
            📒 Added to {customer.name}&apos;s Khata
          </p>
        </div>
      )}

      <p className="text-[#9B948E] text-xs mt-3 mb-8">
        {offline
          ? '⏳ Will sync when online'
          : `Ledger saved${hadCatalog ? ' · Stock updated' : ''}${paymentMethod === 'khata' ? ' · Khata updated' : ''}`
        }
      </p>

      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={onNewSale}
          className="flex-1 py-4 bg-[#C84B2F] text-white rounded-2xl font-bold text-lg active:scale-95"
        >
          New Sale
        </button>
        <button
          onClick={() => router.push('/home')}
          className="flex-1 py-4 bg-white border border-[#D5CFC6] text-[#6B6560] rounded-2xl font-bold text-lg active:scale-95"
        >
          Home
        </button>
      </div>
    </div>
  )
}
