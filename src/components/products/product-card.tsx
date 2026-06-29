'use client'

import Link from 'next/link'
import { Package } from 'lucide-react'
import type { Product } from '@/lib/types/database'

const UNIT_LABELS: Record<string, string> = {
  piece: 'Piece', kg: 'Kg', litre: 'Litre', box: 'Box', dozen: 'Dozen',
}

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const unitLabel = UNIT_LABELS[product.unit] ?? product.unit

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white border border-[#D5CFC6] rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="rounded-xl p-2.5 shrink-0 bg-blue-500/15">
            <Package size={22} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-[#1C1917] truncate">{product.name}</p>
            <p className="text-sm text-[#6B6560]">
              💰 NPR {Number(product.price).toLocaleString('ne-NP')}
            </p>
          </div>
        </div>

        {product.track_stock && (
          <div className="text-right ml-3 shrink-0">
            <p className="text-xl font-bold text-[#1C1917]">
              {Number(product.stock).toLocaleString('ne-NP')}
            </p>
            <p className="text-xs text-[#9B948E]">{unitLabel}</p>
          </div>
        )}
      </div>
    </Link>
  )
}
