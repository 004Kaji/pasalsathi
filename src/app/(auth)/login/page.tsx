'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/db/supabase'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')

  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault(); setEmailError(''); setEmailLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setEmailError('Incorrect email or password'); setEmailLoading(false); return }
    router.push('/home'); router.refresh()
  }

  const inp = 'w-full bg-white border border-[#D5CFC6] rounded-xl px-4 h-12 text-[#1C1917] placeholder:text-[#9B948E] outline-none focus:border-[#C84B2F] focus:ring-2 focus:ring-[#C84B2F]/20 text-base transition-all'
  const btn = 'w-full py-3.5 bg-[#C84B2F] hover:bg-[#E05A3A] active:scale-[0.98] disabled:opacity-50 rounded-xl text-white font-semibold transition-all'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8] px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#C84B2F] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white font-display">PS</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1C1917] font-display">PasalSathi</h1>
          <p className="text-sm text-[#6B6560] mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white border border-[#D5CFC6] rounded-2xl p-6 shadow-sm space-y-5">

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 border border-[#D5CFC6] bg-white rounded-xl py-3 px-4 text-sm font-medium text-[#1C1917] hover:bg-[#F5F0E8] active:scale-[0.98] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E0D9CE]" />
            <span className="text-xs text-[#9B948E]">or</span>
            <div className="flex-1 h-px bg-[#E0D9CE]" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#6B6560] block mb-1.5">Email</label>
              <input type="email" placeholder="your@email.com" value={email}
                onChange={e => setEmail(e.target.value)} required className={inp} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#6B6560]">Password</label>
                <Link href="/forgot-password" className="text-xs text-[#C84B2F] hover:underline">Forgot?</Link>
              </div>
              <input type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)} required className={inp} />
            </div>
            {emailError && <p className="text-sm text-[#C84B2F]">{emailError}</p>}
            <button type="submit" disabled={emailLoading} className={btn}>
              {emailLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

        </div>

        <p className="mt-5 text-center text-sm text-[#6B6560]">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#C84B2F] font-semibold hover:underline">Sign up free</Link>
        </p>
      </div>
    </div>
  )
}
