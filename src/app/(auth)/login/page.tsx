'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/db/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function LoginPage() {
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
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')

  async function handleGoogleLogin() {
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
      setPhoneError(data.error ?? 'Error sending OTP')
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
      setPhoneError(data.error ?? 'Incorrect OTP')
      setPhoneLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash: data.hashed_token,
      type: 'magiclink',
    })

    if (error) {
      setPhoneError('Login failed. Please try again.')
      setPhoneLoading(false)
      return
    }

    router.push('/home')
    router.refresh()
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setEmailError('')
    setEmailLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setEmailError('Incorrect email or password')
      setEmailLoading(false)
      return
    }
    router.push('/home')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />
      <Card className="w-full max-w-sm bg-white/[0.04] border border-white/10 shadow-2xl relative">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🏪</span>
          </div>
          <CardTitle className="text-2xl font-bold text-white">PasalSathi</CardTitle>
          <p className="text-sm text-gray-500">Login to your account</p>
        </CardHeader>
        <CardContent>
          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 border border-white/10 bg-white/5 rounded-xl py-3 px-4 text-sm font-medium text-gray-300 hover:bg-white/10 active:scale-[0.98] transition-all mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Login with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-600">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <Tabs defaultValue="phone">
            <TabsList className="w-full mb-4 bg-white/5 border border-white/10">
              <TabsTrigger value="phone" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-500">📱 Phone Number</TabsTrigger>
              <TabsTrigger value="email" className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-500">✉️ Email</TabsTrigger>
            </TabsList>

            {/* Phone OTP Tab */}
            <TabsContent value="phone" className="space-y-4">
              {!otpSent ? (
                <>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3 bg-gray-100 border rounded-md text-sm text-gray-600 whitespace-nowrap">
                        +977
                      </span>
                      <Input
                        type="tel"
                        placeholder="98XXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        maxLength={10}
                      />
                    </div>
                  </div>
                  {phoneError && <p className="text-sm text-red-500">{phoneError}</p>}
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={handleSendOtp}
                    disabled={phoneLoading || phone.length < 10}
                  >
                    {phoneLoading ? 'Sending...' : 'Send OTP'}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 text-center">
                    OTP sent to <span className="font-medium">+977 {phone}</span>
                  </p>
                  <div className="space-y-2">
                    <Label>OTP Code</Label>
                    <Input
                      type="number"
                      placeholder="6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="text-center text-xl tracking-widest"
                    />
                  </div>
                  {phoneError && <p className="text-sm text-red-500">{phoneError}</p>}
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={handleVerifyOtp}
                    disabled={phoneLoading || otp.length < 6}
                  >
                    {phoneLoading ? 'Verifying...' : 'Login'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); setPhoneError('') }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700"
                  >
                    Change number
                  </button>
                </>
              )}
            </TabsContent>

            {/* Email Tab */}
            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-orange-400 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {emailError && <p className="text-sm text-red-500">{emailError}</p>}
                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={emailLoading}
                >
                  {emailLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-4 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-orange-400 font-medium hover:text-orange-300">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
