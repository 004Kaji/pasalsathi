'use client'
/**
 * onboarding/page.tsx
 * First-time setup — creates the user's business record.
 * Simplified schema: only name, phone, address. No type or plan.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/supabase'

export default function OnboardingPage() {
  const router = useRouter()

  const [businessName, setBusinessName] = useState('')
  const [phone,        setPhone]        = useState('')
  const [address,      setAddress]      = useState('')
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)

  /** Create the business record linked to the current user */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!businessName.trim()) return
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { router.push('/login'); return }

    const { error: insertError } = await supabase.from('businesses').insert({
      owner_id: user.id,
      name:     businessName.trim(),
      phone:    phone.trim() || null,
      address:  address.trim() || null,
    })

    if (insertError) {
      setError('व्यापार बनाउन समस्या भयो। फेरि प्रयास गर्नुहोस्।')
      setLoading(false)
      return
    }

    router.push('/home')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-5xl mb-3">🏪</p>
          <h1 className="text-3xl font-bold text-white">पसलसाथी</h1>
          <p className="text-gray-500 mt-1">तपाईंको पसलको नाम दिनुहोस्</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-400 block mb-2">
                पसलको नाम *
              </label>
              <input
                type="text"
                placeholder="जस्तै: राम किराना पसल"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-orange-500/50 text-base"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-400 block mb-2">
                फोन नम्बर (वैकल्पिक)
              </label>
              <input
                type="tel"
                placeholder="98XXXXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-orange-500/50 text-base"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-400 block mb-2">
                ठेगाना (वैकल्पिक)
              </label>
              <input
                type="text"
                placeholder="जस्तै: नयाँ सडक, काठमाडौं"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-orange-500/50 text-base"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !businessName.trim()}
            className="w-full py-5 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold text-xl rounded-2xl active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'बनाउँदैछ...' : '✓ सुरु गर्नुहोस्'}
          </button>
        </form>
      </div>
    </div>
  )
}
