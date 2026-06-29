'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/supabase'
import { ArrowLeft } from 'lucide-react'

export default function NewCustomerPage() {
  const router = useRouter()
  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('Name is required'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: biz } = await supabase
      .from('businesses').select('id').eq('owner_id', user.id).single()
    if (!biz) { router.push('/onboarding'); return }

    const { error: insertError } = await supabase.from('customers').insert({
      business_id: biz.id,
      name:        name.trim(),
      phone:       phone.trim() || null,
      address:     address.trim() || null,
    })

    if (insertError) {
      setError('Error adding customer. Please try again.')
      setLoading(false)
      return
    }

    router.push('/khata')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Header */}
      <div className="bg-amber-600 px-4 pt-5 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">Add New Customer</h1>
        </div>
        <p className="text-amber-100 text-sm mt-3 ml-1">
          Record credits and payments after adding.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-5 space-y-4 pb-10">

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-400">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="Ram Bahadur Thapa"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder:text-gray-700 outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-400">
            Phone <span className="text-gray-600 font-normal">(for SMS reminders)</span>
          </label>
          <div className="flex gap-2">
            <span className="flex items-center px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-500 whitespace-nowrap">
              +977
            </span>
            <input
              type="tel"
              placeholder="98XXXXXXXX"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              maxLength={10}
              className="flex-1 px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder:text-gray-700 outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-400">Address</label>
          <input
            type="text"
            placeholder="New Road, Kathmandu"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder:text-gray-700 outline-none focus:border-amber-500/50"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full py-5 rounded-2xl bg-amber-600 text-white font-bold text-xl active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? 'Adding...' : '✓ Add Customer'}
        </button>
      </form>
    </div>
  )
}
