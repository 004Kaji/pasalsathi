'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

export default function NewSupplierPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    product_categories: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Supplier name cannot be empty'); return }

    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Please log in'); setLoading(false); return }

    const { data: biz } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()
    if (!biz) { setError('Business not found'); setLoading(false); return }

    const { error: err } = await supabase.from('suppliers').insert({
      business_id: biz.id,
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      product_categories: form.product_categories.trim() || null,
      notes: form.notes.trim() || null,
    })

    if (err) { setError('Error adding supplier'); setLoading(false); return }
    router.push('/supplier')
    router.refresh()
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-orange-500/50 text-base"
  const labelClass = "block text-sm font-medium text-gray-400 mb-1.5"

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 z-10 px-4 pt-5 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/10 text-gray-400">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Add New Supplier</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-6 space-y-5">
        <div>
          <label className={labelClass}>🏭 Supplier Name *</label>
          <input
            type="text"
            placeholder="e.g.: Ramesh Traders"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass}>📱 Phone Number</label>
          <div className="flex gap-2">
            <span className="flex items-center px-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm whitespace-nowrap">
              +977
            </span>
            <input
              type="tel"
              placeholder="98XXXXXXXX"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              className={inputClass}
              maxLength={10}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>📍 Address</label>
          <input
            type="text"
            placeholder="e.g.: New Bazaar, Kathmandu"
            value={form.address}
            onChange={e => set('address', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>📦 Product Categories</label>
          <input
            type="text"
            placeholder="e.g.: Grocery, Oil, Lentils"
            value={form.product_categories}
            onChange={e => set('product_categories', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>📝 Note</label>
          <textarea
            placeholder="Additional info..."
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            className={`${inputClass} resize-none`}
            rows={3}
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white py-4 rounded-2xl font-bold text-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? 'Saving...' : '✓ Save Supplier'}
        </button>
      </form>
    </div>
  )
}
