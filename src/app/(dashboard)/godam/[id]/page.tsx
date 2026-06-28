'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, Package, Pencil } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Product, StockMovement } from '@/types/database'

const UNIT_LABELS: Record<string, string> = {
  piece: 'Piece', kg: 'Kg', litre: 'Litre', box: 'Box', dozen: 'Dozen',
}

type MovementType = 'in' | 'out'

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [businessId, setBusinessId] = useState('')
  const [loading, setLoading] = useState(true)

  // Add movement form
  const [showForm, setShowForm] = useState(false)
  const [movType, setMovType] = useState<MovementType>('in')
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Edit product fields
  const [showEdit, setShowEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBuyPrice, setEditBuyPrice] = useState('')
  const [editSellPrice, setEditSellPrice] = useState('')
  const [editThreshold, setEditThreshold] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: biz } = await supabase.from('businesses').select('id').eq('owner_id', user.id).single()
    if (!biz) return
    setBusinessId(biz.id)

    const [{ data: prod }, { data: movs }] = await Promise.all([
      supabase.from('products').select('*').eq('id', id).single(),
      supabase.from('stock_movements').select('*').eq('product_id', id)
        .order('movement_date', { ascending: false })
        .order('created_at', { ascending: false }),
    ])

    const p = prod as Product
    setProduct(p)
    setEditName(p?.name ?? '')
    setEditBuyPrice(String(p?.buying_price ?? ''))
    setEditSellPrice(String(p?.selling_price ?? ''))
    setEditThreshold(String(p?.low_stock_threshold ?? '5'))
    setMovements((movs as StockMovement[]) ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleAddMovement() {
    setFormError('')
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0) { setFormError('Please enter a valid quantity'); return }
    if (movType === 'out' && product && qty > Number(product.current_stock)) {
      setFormError(`Only ${product.current_stock} ${UNIT_LABELS[product.unit] ?? product.unit} available in stock`)
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const up = parseFloat(unitPrice) || 0
    await supabase.from('stock_movements').insert({
      business_id: businessId,
      product_id: id,
      type: movType,
      quantity: qty,
      unit_price: up || null,
      total_price: up ? up * qty : null,
      supplier_name: supplier.trim() || null,
      notes: notes.trim() || null,
      created_by: user.id,
    })

    // Update current stock
    const newStock = movType === 'in'
      ? Number(product?.current_stock ?? 0) + qty
      : Number(product?.current_stock ?? 0) - qty

    await supabase.from('products').update({ current_stock: newStock }).eq('id', id)

    setQuantity(''); setUnitPrice(''); setSupplier(''); setNotes('')
    setShowForm(false)
    setSaving(false)
    await fetchData()
  }

  async function handleSaveEdit() {
    setEditSaving(true)
    const supabase = createClient()
    await supabase.from('products').update({
      name: editName.trim(),
      buying_price: parseFloat(editBuyPrice) || 0,
      selling_price: parseFloat(editSellPrice) || 0,
      low_stock_threshold: parseFloat(editThreshold) || 5,
    }).eq('id', id)
    setShowEdit(false)
    setEditSaving(false)
    await fetchData()
  }

  async function handleDeactivate() {
    const supabase = createClient()
    await supabase.from('products').update({ is_active: false }).eq('id', id)
    router.push('/godam')
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-lg">Loading...</div>
  if (!product) return <div className="flex items-center justify-center min-h-screen text-red-500 text-lg">Item not found</div>

  const isLow = Number(product.current_stock) <= Number(product.low_stock_threshold)
  const unit = UNIT_LABELS[product.unit] ?? product.unit
  const stockValue = Number(product.current_stock) * Number(product.buying_price)

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className={`px-4 pt-5 pb-6 ${isLow ? 'bg-red-600' : 'bg-blue-600'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform">
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-xl font-bold text-white truncate max-w-[180px]">{product.name}</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEdit(!showEdit)}
              className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform"
            >
              <Pencil size={20} />
            </button>
            <AlertDialog>
              <AlertDialogTrigger className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform text-sm font-semibold px-3">
                Delete
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl">Remove Item?</AlertDialogTitle>
                  <AlertDialogDescription className="text-base">
                    "{product.name}" will be removed from the warehouse.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-base">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeactivate} className="bg-red-600 hover:bg-red-700 text-base">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Stock info */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-white/70 text-xs">Current Stock</p>
            <p className="text-white text-2xl font-bold">{Number(product.current_stock).toLocaleString('ne-NP')}</p>
            <p className="text-white/70 text-xs">{unit}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-white/70 text-xs">Selling Price</p>
            <p className="text-white text-lg font-bold">NPR {Number(product.selling_price).toLocaleString('ne-NP')}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-white/70 text-xs">Stock Value</p>
            <p className="text-white text-lg font-bold">NPR {stockValue.toLocaleString('ne-NP')}</p>
          </div>
        </div>

        {isLow && (
          <div className="mt-3 flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2.5">
            <AlertTriangle size={18} className="text-yellow-300 shrink-0" />
            <p className="text-white text-sm font-medium">
              Low stock! Minimum {product.low_stock_threshold} {unit} required
            </p>
          </div>
        )}
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Edit form */}
        {showEdit && (
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3 border-2 border-blue-200">
            <h3 className="text-base font-bold text-blue-700">Edit Item</h3>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">Name</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)}
                className="w-full text-base border border-gray-200 rounded-xl px-4 h-12 outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Buying Price', val: editBuyPrice, set: setEditBuyPrice },
                { label: 'Selling Price', val: editSellPrice, set: setEditSellPrice },
              ].map(({ label, val, set }) => (
                <div key={label} className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 block">{label}</label>
                  <input type="number" value={val} onChange={(e) => set(e.target.value)}
                    className="w-full text-base border border-gray-200 rounded-xl px-3 h-11 outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 block">Low Stock Alert ({unit})</label>
              <input type="number" value={editThreshold} onChange={(e) => setEditThreshold(e.target.value)}
                className="w-full text-base border border-orange-200 rounded-xl px-3 h-11 outline-none bg-orange-50 focus:ring-2 focus:ring-orange-400" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEdit(false)} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold active:scale-[0.98]">Cancel</button>
              <button onClick={handleSaveEdit} disabled={editSaving}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold active:scale-[0.98] disabled:opacity-50">
                {editSaving ? 'Saving...' : '✓ Save'}
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setMovType('in'); setShowForm(true) }}
            className="flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-2xl font-bold text-base active:scale-[0.98] transition-transform"
          >
            <TrendingUp size={20} /> Add Stock
          </button>
          <button
            onClick={() => { setMovType('out'); setShowForm(true) }}
            className="flex items-center justify-center gap-2 py-4 bg-red-600 text-white rounded-2xl font-bold text-base active:scale-[0.98] transition-transform"
          >
            <TrendingDown size={20} /> Reduce Stock
          </button>
        </div>

        {/* Movement form */}
        {showForm && (
          <div className={`rounded-2xl p-5 border-2 shadow-sm ${movType === 'in' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <h3 className={`text-lg font-bold mb-4 ${movType === 'in' ? 'text-green-700' : 'text-red-700'}`}>
              {movType === 'in' ? '🟢 Stock In' : '🔴 Stock Out'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Quantity ({unit}) *</label>
                <div className="flex items-center bg-white rounded-xl px-4 py-3 border border-gray-200 gap-2">
                  <input type="number" inputMode="decimal" placeholder="0" value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="flex-1 text-3xl font-bold text-gray-900 border-0 outline-none bg-transparent placeholder-gray-200"
                    autoFocus />
                  <span className="text-gray-400 font-medium">{unit}</span>
                </div>
              </div>
              {movType === 'in' && (
                <>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">Unit Price (NPR)</label>
                    <input type="number" inputMode="decimal" placeholder="0" value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      className="w-full text-base border border-gray-200 rounded-xl px-4 h-12 outline-none focus:ring-2 focus:ring-green-400 bg-white" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">Supplier</label>
                    <input type="text" placeholder="e.g.: Ram Traders, Kathmandu" value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      className="w-full text-base border border-gray-200 rounded-xl px-4 h-12 outline-none focus:ring-2 focus:ring-green-400 bg-white" />
                  </div>
                </>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Note (optional)</label>
                <input type="text" placeholder="Additional info..." value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-base border border-gray-200 rounded-xl px-4 h-12 outline-none bg-white" />
              </div>
              {formError && <p className="text-red-600 text-sm font-medium">{formError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowForm(false); setQuantity(''); setUnitPrice(''); setSupplier(''); setNotes(''); setFormError('') }}
                  className="flex-1 py-4 rounded-xl border-2 border-gray-300 text-gray-600 font-semibold text-base active:scale-[0.98]">
                  Cancel
                </button>
                <button type="button" onClick={handleAddMovement} disabled={saving || !quantity}
                  className={`flex-1 py-4 rounded-xl text-white font-bold text-base active:scale-[0.98] disabled:opacity-50 ${movType === 'in' ? 'bg-green-600' : 'bg-red-600'}`}>
                  {saving ? 'Saving...' : '✓ Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Movement history */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">Stock History</h2>
          {movements.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-gray-500 text-base">No movements yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {movements.map((m) => (
                <MovementRow key={m.id} movement={m} unit={unit} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MovementRow({ movement, unit }: { movement: StockMovement; unit: string }) {
  const isIn = movement.type === 'in'
  return (
    <div className={`rounded-xl p-4 border flex items-center justify-between ${isIn ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${isIn ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          {isIn ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {isIn ? (movement.supplier_name ?? 'Stock added') : (movement.notes ?? 'Stock reduced')}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(movement.movement_date).toLocaleDateString('ne-NP', { year: 'numeric', month: 'short', day: 'numeric' })}
            {movement.total_price ? ` · NPR ${Number(movement.total_price).toLocaleString('ne-NP')}` : ''}
          </p>
        </div>
      </div>
      <p className={`text-lg font-bold ${isIn ? 'text-green-700' : 'text-red-700'}`}>
        {isIn ? '+' : '-'}{Number(movement.quantity).toLocaleString('ne-NP')} {unit}
      </p>
    </div>
  )
}
