'use client'
/**
 * product-card.tsx
 * Displays a single physical product in the inventory list.
 * Column names match 004_clean_schema.sql: stock, price (not current_stock, selling_price).
 */

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
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="rounded-xl p-2.5 shrink-0 bg-blue-500/20">
            <Package size={22} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-white truncate">{product.name}</p>
            <p className="text-sm text-gray-500">
              💰 NPR {Number(product.price).toLocaleString('ne-NP')}
            </p>
          </div>
        </div>

        {/* Stock count — only shown when track_stock is enabled */}
        {product.track_stock && (
          <div className="text-right ml-3 shrink-0">
            <p className="text-xl font-bold text-white">
              {Number(product.stock).toLocaleString('ne-NP')}
            </p>
            <p className="text-xs text-gray-500">{unitLabel}</p>
          </div>
        )}
      </div>
    </Link>
  )
}
