'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/supabase'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

export default function NewCustomerPage() {
  const router = useRouter()
  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('Name is required'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: biz } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()

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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-amber-600 px-4 pt-5 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">Add New Customer</h1>
        </div>
        <p className="text-amber-100 text-sm mt-3">Enter customer details. You can record credits and payments later.</p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-5 space-y-4 pb-10">

        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          {/* Name - required */}
          <div className="space-y-2">
            <Label className="text-base font-semibold text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g.: Ram Bahadur Thapa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-base h-12 rounded-xl"
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label className="text-base font-semibold text-gray-700">
              Phone Number
              <span className="text-gray-400 font-normal ml-2">(for SMS reminders)</span>
            </Label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 bg-gray-100 border rounded-xl text-sm text-gray-600 whitespace-nowrap">
                +977
              </span>
              <Input
                type="tel"
                placeholder="98XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-base h-12 rounded-xl"
                maxLength={10}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label className="text-base font-semibold text-gray-700">Address</Label>
            <Input
              placeholder="e.g.: New Road, Kathmandu"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="text-base h-12 rounded-xl"
            />
          </div>

        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-base">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full py-5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xl active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? 'Adding...' : '✓ Add Customer'}
        </button>
      </form>
    </div>
  )
}
