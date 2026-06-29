'use client'
// Full-screen sale confirmation shown after a successful checkout
import { CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { SaleResult } from '@/lib/types/app'

interface Props {
  result: SaleResult
  onNewSale: () => void
}

export default function SuccessScreen({ result, onNewSale }: Props) {
  const router = useRouter()
  const { total, items, discountPercent, paymentMethod, customer } = result
  const hadCatalog = items.some(i => !i.isQuick)

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
        <CheckCircle size={48} className="text-green-400" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-1">Sale Complete!</h1>
      <p className="text-5xl font-bold text-green-400 mb-3">
        NPR {total.toLocaleString('ne-NP', { maximumFractionDigits: 2 })}
      </p>
      <div className="space-y-1 text-sm text-gray-500 mb-3">
        {items.map(i => (
          <p key={i.id}>{i.name} × {i.qty} — NPR {(i.qty * i.unitPrice).toLocaleString('ne-NP')}</p>
        ))}
      </div>
      {discountPercent > 0 && (
        <p className="text-amber-400 text-sm mb-2">{discountPercent}% discount applied</p>
      )}
      {paymentMethod === 'khata' && customer && (
        <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
          <p className="text-amber-400 text-sm font-semibold">
            📒 Added to {customer.name}&apos;s Khata
          </p>
        </div>
      )}
      <p className="text-gray-600 text-xs mt-3 mb-8">
        Ledger saved
        {hadCatalog ? ' · Stock updated' : ''}
        {paymentMethod === 'khata' ? ' · Khata updated' : ''}
      </p>
      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={onNewSale}
          className="flex-1 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-bold text-lg active:scale-95"
        >
          New Sale
        </button>
        <button
          onClick={() => router.push('/home')}
          className="flex-1 py-4 bg-white/10 border border-white/10 text-gray-300 rounded-2xl font-bold text-lg active:scale-95"
        >
          Home
        </button>
      </div>
    </div>
  )
}
