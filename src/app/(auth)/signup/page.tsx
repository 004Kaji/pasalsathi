'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/db/supabase'
import { Eye, EyeOff } from 'lucide-react'

function getPasswordError(pwd: string): string {
  if (pwd.length < 8) return 'Password must be at least 8 characters'
  if (!/\d/.test(pwd)) return 'Password must contain at least 1 number'
  return ''
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
)

export default function SignupPage() {
  const router = useRouter()

  const [tab, setTab] = useState<'phone' | 'email'>('phone')
  const [phone, setPhone]           = useState('')
  const [otp, setOtp]               = useState('')
  const [otpSent, setOtpSent]       = useState(false)
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneError, setPhoneError] = useState('')

  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')

  async function handleGoogleSignup() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handleSendOtp() {
    setPhoneError(''); setPhoneLoading(true)
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    const data = await res.json() as { error?: string }
    if (!res.ok) { setPhoneError(data.error ?? 'Could not send OTP.'); setPhoneLoading(false); return }
    setOtpSent(true); setPhoneLoading(false)
  }

  async function handleVerifyOtp() {
    setPhoneError(''); setPhoneLoading(true)
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    })
    const data = await res.json() as { hashed_token?: string; error?: string }
    if (!res.ok || !data.hashed_token) { setPhoneError(data.error ?? 'Incorrect OTP.'); setPhoneLoading(false); return }
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: data.hashed_token, type: 'magiclink' })
    if (error) { setPhoneError('Login failed. Please try again.'); setPhoneLoading(false); return }
    router.push('/home')
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault(); setEmailError('')
    const pwdError = getPasswordError(password)
    if (pwdError) { setEmailError(pwdError); return }
    if (password !== confirm) { setEmailError('Passwords do not match'); return }
    setEmailLoading(true)
    const res = await fetch('/api/auth/email-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json() as { hashed_token?: string; error?: string }
    if (!res.ok || !data.hashed_token) { setEmailError(data.error ?? 'Could not create account.'); setEmailLoading(false); return }
    const supabase = createClient()
    const { error: sessionError } = await supabase.auth.verifyOtp({ token_hash: data.hashed_token, type: 'magiclink' })
    if (sessionError) { setEmailError('Signup done — please sign in.'); setEmailLoading(false); return }
    router.push('/home')
  }

  const inp = 'w-full bg-white border border-[#D5CFC6] rounded-xl px-4 h-12 text-[#1C1917] placeholder:text-[#9B948E] outline-none focus:border-[#C84B2F] focus:ring-2 focus:ring-[#C84B2F]/20 text-base transition-all'
  const btn = 'w-full py-3.5 bg-[#C84B2F] hover:bg-[#E05A3A] active:scale-[0.98] disabled:opacity-50 rounded-xl text-white font-semibold transition-all'
  const hint = (ok: boolean, label: string) => (
    <span className={ok ? 'text-[#4A7055]' : 'text-[#9B948E]'}>{ok ? '✓' : '○'} {label}</span>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8] px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#C84B2F] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white font-display">PS</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1C1917] font-display">PasalSathi</h1>
          <p className="text-sm text-[#6B6560] mt-1">Create your free account</p>
        </div>

        <div className="bg-white border border-[#D5CFC6] rounded-2xl p-6 shadow-sm space-y-5">

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 border border-[#D5CFC6] bg-white rounded-xl py-3 px-4 text-sm font-medium text-[#1C1917] hover:bg-[#F5F0E8] active:scale-[0.98] transition-all"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E0D9CE]" />
            <span className="text-xs text-[#9B948E]">or</span>
            <div className="flex-1 h-px bg-[#E0D9CE]" />
          </div>

          {/* Tab switcher */}
          <div className="flex bg-[#F5F0E8] rounded-xl p-1">
            {(['phone', 'email'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  tab === t ? 'bg-white shadow-sm text-[#1C1917]' : 'text-[#6B6560]'
                }`}
              >
                {t === 'phone' ? '📱 Phone' : '✉️ Email'}
              </button>
            ))}
          </div>

          {/* Phone tab */}
          {tab === 'phone' && (
            <div className="space-y-3">
              {!otpSent ? (
                <>
                  <div>
                    <label className="text-xs font-semibold text-[#6B6560] block mb-1.5">Phone Number</label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3 bg-[#EDE8DF] border border-[#D5CFC6] rounded-xl text-sm text-[#6B6560] whitespace-nowrap font-mono">+977</span>
                      <input type="tel" placeholder="98XXXXXXXX" value={phone}
                        onChange={e => setPhone(e.target.value)} maxLength={10} className={inp} />
                    </div>
                  </div>
                  {phoneError && <p className="text-sm text-[#C84B2F]">{phoneError}</p>}
                  <button onClick={handleSendOtp} disabled={phoneLoading || phone.length < 10} className={btn}>
                    {phoneLoading ? 'Sending...' : 'Send OTP'}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#6B6560] text-center">OTP sent to <span className="font-semibold text-[#1C1917]">+977 {phone}</span></p>
                  <div>
                    <label className="text-xs font-semibold text-[#6B6560] block mb-1.5">OTP Code</label>
                    <input type="number" placeholder="6-digit code" value={otp}
                      onChange={e => setOtp(e.target.value)} className={inp + ' text-center text-xl tracking-widest font-mono'} />
                  </div>
                  {phoneError && <p className="text-sm text-[#C84B2F]">{phoneError}</p>}
                  <button onClick={handleVerifyOtp} disabled={phoneLoading || otp.length < 6} className={btn}>
                    {phoneLoading ? 'Verifying...' : 'Create Account'}
                  </button>
                  <button type="button" onClick={() => { setOtpSent(false); setOtp(''); setPhoneError('') }}
                    className="w-full text-sm text-[#6B6560] hover:text-[#1C1917]">
                    Change number
                  </button>
                </>
              )}
            </div>
          )}

          {/* Email tab */}
          {tab === 'email' && (
            <form onSubmit={handleEmailSignup} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#6B6560] block mb-1.5">Email</label>
                <input type="email" placeholder="your@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} required className={inp} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6B6560] block mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} placeholder="Min 8 chars, 1 number"
                    value={password} onChange={e => setPassword(e.target.value)} required className={inp + ' pr-12'} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B948E] hover:text-[#6B6560]">
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6B6560] block mb-1.5">Confirm password</label>
                <input type={showPwd ? 'text' : 'password'} placeholder="Repeat password"
                  value={confirm} onChange={e => setConfirm(e.target.value)} required className={inp} />
              </div>
              <div className="flex gap-4 text-xs">
                {hint(password.length >= 8, '8+ chars')}
                {hint(/\d/.test(password), '1 number')}
                {hint(Boolean(confirm) && password === confirm, 'match')}
              </div>
              {emailError && <p className="text-sm text-[#C84B2F]">{emailError}</p>}
              <button type="submit" disabled={emailLoading} className={btn}>
                {emailLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

        </div>

        <p className="mt-5 text-center text-sm text-[#6B6560]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#C84B2F] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
