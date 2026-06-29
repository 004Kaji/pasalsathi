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
    if (!biz) { router.push('/home'); return }

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

  const inp = 'w-full px-4 py-3.5 bg-white border border-[#D5CFC6] rounded-xl text-[#1C1917] text-base placeholder:text-[#9B948E] outline-none focus:border-[#C84B2F]/50 transition-all'

  return (
    <div className="min-h-screen bg-[#F5F0E8]">

      {/* Header */}
      <div className="bg-[#C84B2F] px-4 pt-5 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">Add New Customer</h1>
        </div>
        <p className="text-white/80 text-sm mt-3 ml-1">
          Record credits and payments after adding.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-5 space-y-4 pb-10">

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[#6B6560]">
            Full Name <span className="text-[#C84B2F]">*</span>
          </label>
          <input
            type="text"
            placeholder="Ram Bahadur Thapa"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className={inp}
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[#6B6560]">
            Phone <span className="text-[#9B948E] font-normal">(for SMS reminders)</span>
          </label>
          <div className="flex gap-2">
            <span className="flex items-center px-3 bg-[#EDE8DF] border border-[#D5CFC6] rounded-xl text-sm text-[#6B6560] whitespace-nowrap font-mono">
              +977
            </span>
            <input
              type="tel"
              placeholder="98XXXXXXXX"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              maxLength={10}
              className={inp}
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[#6B6560]">Address</label>
          <input
            type="text"
            placeholder="New Road, Kathmandu"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className={inp}
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-500 text-sm font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full py-5 rounded-2xl bg-[#C84B2F] text-white font-bold text-xl active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? 'Adding...' : '✓ Add Customer'}
        </button>
      </form>
    </div>
  )
}
