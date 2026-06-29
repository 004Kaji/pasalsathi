'use client'
/**
 * products/[id]/page.tsx
 * Product/service detail — view, edit, and delete an item.
 * Uses simplified schema: price, stock, track_stock.
 * No stock_movements table — stock is updated directly via +/- adjustment.
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/db/supabase'
import { ArrowLeft, Pencil, Plus, Minus, Trash2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Product } from '@/lib/types/database'

const UNIT_LABELS: Record<string, string> = {
  piece: 'Piece', kg: 'Kg', litre: 'Litre', box: 'Box', dozen: 'Dozen',
}

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product,  setProduct]  = useState<Product | null>(null)
  const [loading,  setLoading]  = useState(true)

  const [showEdit,   setShowEdit]   = useState(false)
  const [editName,   setEditName]   = useState('')
  const [editPrice,  setEditPrice]  = useState('')
  const [editStock,  setEditStock]  = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const [adjQty,     setAdjQty]     = useState('')
  const [adjType,    setAdjType]    = useState<'add' | 'remove'>('add')
  const [showAdj,    setShowAdj]    = useState(false)
  const [adjSaving,  setAdjSaving]  = useState(false)

  /** Load the product by id */
  const fetchProduct = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('products').select('*').eq('id', productId).single()
    if (!data) { router.push('/products'); return }
    const p = data as Product
    setProduct(p)
    setEditName(p.name)
    setEditPrice(String(p.price))
    setEditStock(String(p.stock ?? 0))
    setLoading(false)
  }, [productId, router])

  useEffect(() => { fetchProduct() }, [fetchProduct])

  /** Save edited name and price */
  async function handleSaveEdit() {
    setEditSaving(true)
    const supabase = createClient()
    await supabase.from('products').update({
      name:  editName.trim(),
      price: parseFloat(editPrice) || 0,
    }).eq('id', productId)
    setShowEdit(false)
    setEditSaving(false)
    await fetchProduct()
  }

  /** Apply a +/- stock adjustment directly to the stock column */
  async function handleAdjustStock() {
    const qty = parseFloat(adjQty)
    if (!qty || qty <= 0) return

    const currentStock = Number(product?.stock ?? 0)
    const newStock = adjType === 'add'
      ? currentStock + qty
      : Math.max(0, currentStock - qty)

    setAdjSaving(true)
    const supabase = createClient()
    await supabase.from('products').update({ stock: newStock }).eq('id', productId)
    setAdjQty('')
    setShowAdj(false)
    setAdjSaving(false)
    await fetchProduct()
  }

  /** Hard-delete the product and return to the list */
  async function handleDelete() {
    const supabase = createClient()
    await supabase.from('products').delete().eq('id', productId)
    router.push('/products')
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-lg">Loading...</div>
  if (!product) return null

  const isService = product.type === 'service'
  const unit      = UNIT_LABELS[product.unit] ?? product.unit
  const stock     = Number(product.stock ?? 0)

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      {/* Header */}
      <div className={`px-4 pt-5 pb-6 ${isService ? 'bg-purple-700' : 'bg-blue-700'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/20 text-white active:scale-95">
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-xl font-bold text-white truncate max-w-[200px]">{product.name}</h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowEdit(v => !v)}
              className="p-2 rounded-xl bg-white/20 text-white active:scale-95"
            >
              <Pencil size={20} />
            </button>
            <AlertDialog>
              <AlertDialogTrigger className="p-2 rounded-xl bg-white/20 text-white active:scale-95">
                <Trash2 size={20} />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{product.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove the item from your inventory.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-white/70 text-xs">Price</p>
            <p className="text-white text-xl font-bold">NPR {Number(product.price).toLocaleString('ne-NP')}</p>
            <p className="text-white/60 text-xs">per {unit}</p>
          </div>
          {!isService && product.track_stock && (
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-white/70 text-xs">Stock</p>
              <p className="text-white text-xl font-bold">{stock.toLocaleString('ne-NP')}</p>
              <p className="text-white/60 text-xs">{unit} remaining</p>
            </div>
          )}
          {isService && (
            <div className="bg-white/15 rounded-xl p-3 text-center flex items-center justify-center">
              <span className="text-purple-200 text-sm font-semibold">Service — no stock</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Edit form */}
        {showEdit && (
          <div className="bg-[#111] rounded-2xl p-5 space-y-3 border border-white/10">
            <h3 className="text-base font-bold text-white">Edit Item</h3>
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Name</label>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full text-base bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-white outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">Price (NPR)</label>
              <input
                type="number"
                step="any"
                value={editPrice}
                onChange={e => setEditPrice(e.target.value)}
                className="w-full text-base bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-white outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEdit(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-semibold active:scale-[0.98]">
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={editSaving} className="flex-1 py-3 rounded-xl bg-orange-600 text-white font-bold active:scale-[0.98] disabled:opacity-50">
                {editSaving ? 'Saving...' : '✓ Save'}
              </button>
            </div>
          </div>
        )}

        {/* Stock adjustment buttons — only shown for tracked physical products */}
        {!isService && product.track_stock && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setAdjType('add'); setShowAdj(true) }}
                className="flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-2xl font-bold text-base active:scale-[0.98]"
              >
                <Plus size={20} /> Add Stock
              </button>
              <button
                onClick={() => { setAdjType('remove'); setShowAdj(true) }}
                className="flex items-center justify-center gap-2 py-4 bg-red-600 text-white rounded-2xl font-bold text-base active:scale-[0.98]"
              >
                <Minus size={20} /> Remove Stock
              </button>
            </div>

            {showAdj && (
              <div className={`rounded-2xl p-5 border ${adjType === 'add' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <h3 className={`text-lg font-bold mb-4 ${adjType === 'add' ? 'text-green-400' : 'text-red-400'}`}>
                  {adjType === 'add' ? '🟢 Add Stock' : '🔴 Remove Stock'}
                </h3>
                <label className="text-sm font-semibold text-gray-400 block mb-2">Quantity ({unit}) *</label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={adjQty}
                    onChange={e => setAdjQty(e.target.value)}
                    className="flex-1 text-3xl font-bold text-white border-0 outline-none bg-transparent placeholder:text-gray-700"
                  />
                  <span className="text-gray-500 font-medium">{unit}</span>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowAdj(false); setAdjQty('') }}
                    className="flex-1 py-4 rounded-xl border border-white/10 text-gray-400 font-semibold active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAdjustStock}
                    disabled={adjSaving || !adjQty}
                    className={`flex-1 py-4 rounded-xl text-white font-bold active:scale-[0.98] disabled:opacity-50 ${adjType === 'add' ? 'bg-green-600' : 'bg-red-600'}`}
                  >
                    {adjSaving ? 'Saving...' : '✓ Adjust'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
