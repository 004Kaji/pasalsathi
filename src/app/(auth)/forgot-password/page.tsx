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
    // Always show success — don't reveal if email exists
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    })

    setLoading(false)
    setSent(true)
  }

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-orange-500/50 text-base'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm relative">
        <Link
          href="/login"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-6 w-fit"
        >
          <ArrowLeft size={16} /> Back to login
        </Link>

        <div className="bg-white/[0.04] border border-white/10 rounded-2xl shadow-2xl p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🔑</span>
            </div>
            <h1 className="text-xl font-bold text-white">Forgot password?</h1>
            <p className="text-sm text-gray-500 mt-1">
              Enter your email and we&apos;ll send a reset link
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">📧</div>
              <div>
                <p className="text-white font-semibold">Check your email</p>
                <p className="text-sm text-gray-500 mt-1">
                  If <span className="text-gray-300">{email}</span> is registered, you&apos;ll
                  receive a reset link shortly.
                </p>
              </div>
              <Link
                href="/login"
                className="block w-full py-3 text-center bg-white/5 border border-white/10 rounded-xl text-gray-300 font-medium hover:bg-white/10 transition-colors"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-400">Email address</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] disabled:opacity-50 rounded-xl text-white font-semibold transition-all"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>

              <p className="text-center text-sm text-gray-600">
                Remember your password?{' '}
                <Link href="/login" className="text-orange-400 hover:text-orange-300">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
