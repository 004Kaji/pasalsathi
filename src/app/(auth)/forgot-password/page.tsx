'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/db/supabase'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    })
    setLoading(false)
    setSent(true)
  }

  const inputClass = 'w-full bg-white border border-[#D5CFC6] rounded-xl px-4 h-12 text-[#1C1917] placeholder:text-[#9B948E] outline-none focus:ring-2 focus:ring-[#C84B2F]/30 focus:border-[#C84B2F] text-base transition-all'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8] px-4">
      <div className="w-full max-w-sm">
        <Link href="/login" className="flex items-center gap-2 text-[#6B6560] hover:text-[#1C1917] text-sm mb-6 w-fit transition-colors">
          <ArrowLeft size={16} /> Back to login
        </Link>

        <div className="bg-white border border-[#D5CFC6] rounded-2xl shadow-sm p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-[#C84B2F]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🔑</span>
            </div>
            <h1 className="text-xl font-bold text-[#1C1917]">Forgot password?</h1>
            <p className="text-sm text-[#6B6560] mt-1">Enter your email and we&apos;ll send a reset link</p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">📧</div>
              <div>
                <p className="text-[#1C1917] font-semibold">Check your email</p>
                <p className="text-sm text-[#6B6560] mt-1">
                  If <span className="text-[#1C1917] font-medium">{email}</span> is registered, you&apos;ll receive a reset link shortly.
                </p>
              </div>
              <Link href="/login" className="block w-full py-3 text-center bg-[#F5F0E8] border border-[#D5CFC6] rounded-xl text-[#6B6560] font-medium hover:bg-[#EDE8DF] transition-colors">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6B6560]">Email address</label>
                <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
              </div>
              <button type="submit" disabled={loading || !email}
                className="w-full py-3 bg-[#C84B2F] hover:bg-[#E05A3A] active:scale-[0.98] disabled:opacity-50 rounded-xl text-white font-semibold transition-all">
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              <p className="text-center text-sm text-[#6B6560]">
                Remember your password?{' '}
                <Link href="/login" className="text-[#C84B2F] hover:underline font-medium">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
