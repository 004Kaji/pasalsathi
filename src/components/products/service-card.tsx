'use client'
// Displays a service item in the inventory list
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
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="rounded-xl p-2.5 shrink-0 bg-purple-500/20">
            <Wrench size={22} className="text-purple-400" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-white truncate">{product.name}</p>
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-semibold">
              SERVICE
            </span>
          </div>
        </div>
        <div className="text-right ml-3 shrink-0">
          <p className="text-xl font-bold text-purple-300">
            NPR {Number(product.price).toLocaleString('ne-NP')}
          </p>
          <p className="text-xs text-gray-500">per {UNIT_LABELS[product.unit] ?? product.unit}</p>
        </div>
      </div>
    </Link>
  )
}
