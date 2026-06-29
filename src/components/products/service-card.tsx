'use client'

import Link from 'next/link'
import { Wrench } from 'lucide-react'
import type { Product } from '@/lib/types/database'

const UNIT_LABELS: Record<string, string> = {
  session: 'Session', hour: 'Hr', service: 'Service', piece: 'Piece',
}

interface Props {
  product: Product
}

export default function ServiceCard({ product }: Props) {
  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white border border-[#D5CFC6] rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="rounded-xl p-2.5 shrink-0 bg-purple-500/15">
            <Wrench size={22} className="text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-[#1C1917] truncate">{product.name}</p>
            <span className="text-xs bg-purple-500/15 text-purple-600 px-2 py-0.5 rounded-full font-semibold">
              SERVICE
            </span>
          </div>
        </div>
        <div className="text-right ml-3 shrink-0">
          <p className="text-xl font-bold text-purple-600">
            NPR {Number(product.price).toLocaleString('ne-NP')}
          </p>
          <p className="text-xs text-[#9B948E]">per {UNIT_LABELS[product.unit] ?? product.unit}</p>
        </div>
      </div>
    </Link>
  )
}
