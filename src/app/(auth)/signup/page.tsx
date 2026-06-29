'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/db/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  // Phone OTP state
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneError, setPhoneError] = useState('')

  // Email state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
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
    setPhoneError('')
    setPhoneLoading(true)
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    const data = await res.json() as { error?: string }
    if (!res.ok) {
      setPhoneError(data.error ?? 'Could not send OTP. Try again.')
      setPhoneLoading(false)
      return
    }
    setOtpSent(true)
    setPhoneLoading(false)
  }

  async function handleVerifyOtp() {
    setPhoneError('')
    setPhoneLoading(true)
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    })
    const data = await res.json() as { hashed_token?: string; error?: string }
    if (!res.ok || !data.hashed_token) {
      setPhoneError(data.error ?? 'Incorrect OTP. Try again.')
      setPhoneLoading(false)
      return
    }
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: data.hashed_token, type: 'magiclink' })
    if (error) {
      setPhoneError('Login failed. Please try again.')
      setPhoneLoading(false)
      return
    }
    router.push('/onboarding')
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault()
    setEmailError('')

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
    if (!res.ok || !data.hashed_token) {
      setEmailError(data.error ?? 'Could not create account. Try again.')
      setEmailLoading(false)
      return
    }
    const supabase = createClient()
    const { error: sessionError } = await supabase.auth.verifyOtp({ token_hash: data.hashed_token, type: 'magiclink' })
    if (sessionError) {
      setEmailError('Login failed after signup. Please sign in manually.')
      setEmailLoading(false)
      return
    }
    router.push('/onboarding')
  }

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-orange-500/50 text-base'
  const hint = (ok: boolean, label: string) => (
    <span className={ok ? 'text-green-400' : 'text-gray-600'}>{ok ? '✓' : '○'} {label}</span>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 py-8">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm bg-white/[0.04] border border-white/10 rounded-2xl shadow-2xl relative">
        <div className="text-center pt-6 pb-4 px-6">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🏪</span>
          </div>
          <h1 className="text-2xl font-bold text-white">PasalSathi</h1>
          <p className="text-sm text-gray-500 mt-1">Create your free account</p>
        </div>

        <div className="px-6 pb-6">
          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 border border-white/10 bg-white/5 rounded-xl py-3 px-4 text-sm font-medium text-gray-300 hover:bg-white/10 active:scale-[0.98] transition-all mb-4"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-600">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <Tabs defaultValue="phone">
            <TabsList className="w-full mb-4 bg-white/5 border border-white/10">
              <TabsTrigger value="phone" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-500">📱 Phone</TabsTrigger>
              <TabsTrigger value="email" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-500">✉️ Email</TabsTrigger>
            </TabsList>

            {/* Phone OTP Tab */}
            <TabsContent value="phone" className="space-y-4">
              {!otpSent ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-400">Phone Number</label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-500 whitespace-nowrap">
                        +977
                      </span>
                      <input
                        type="tel"
                        placeholder="98XXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        maxLength={10}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  {phoneError && <p className="text-sm text-red-400">{phoneError}</p>}
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={phoneLoading || phone.length < 10}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] disabled:opacity-50 rounded-xl text-white font-semibold transition-all"
                  >
                    {phoneLoading ? 'Sending...' : 'Send OTP'}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500 text-center">
                    OTP sent to <span className="text-gray-300 font-medium">+977 {phone}</span>
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-400">OTP Code</label>
                    <input
                      type="number"
                      placeholder="6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className={inputClass + ' text-center text-xl tracking-widest'}
                    />
                  </div>
                  {phoneError && <p className="text-sm text-red-400">{phoneError}</p>}
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={phoneLoading || otp.length < 6}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] disabled:opacity-50 rounded-xl text-white font-semibold transition-all"
                  >
                    {phoneLoading ? 'Verifying...' : 'Verify & Create Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); setPhoneError('') }}
                    className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Change number
                  </button>
                </>
              )}
            </TabsContent>

            {/* Email Tab */}
            <TabsContent value="email">
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-gray-400">Email</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-gray-400">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Min 8 chars, 1 number"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={inputClass + ' pr-12'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="confirm" className="text-sm font-medium text-gray-400">Confirm password</label>
                  <input
                    id="confirm"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="flex gap-4 text-xs">
                  {hint(password.length >= 8, '8+ chars')}
                  {hint(/\d/.test(password), '1 number')}
                  {hint(Boolean(confirm) && password === confirm, 'match')}
                </div>

                {emailError && <p className="text-sm text-red-400">{emailError}</p>}
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] disabled:opacity-50 rounded-xl text-white font-semibold transition-all"
                >
                  {emailLoading ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-400 font-medium hover:text-orange-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
