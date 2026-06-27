'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
      setPhoneError(data.error ?? 'OTP पठाउन समस्या भयो')
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
      setPhoneError(data.error ?? 'OTP गलत छ')
      setPhoneLoading(false)
      return
    }

    // Establish client session using the hashed token
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash: data.hashed_token,
      type: 'magiclink',
    })

    if (error) {
      setPhoneError('लगइन गर्न समस्या भयो। फेरि प्रयास गर्नुहोस्।')
      setPhoneLoading(false)
      return
    }

    router.push('/onboarding')
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault()
    setEmailError('')
    setEmailLoading(true)

    const res = await fetch('/api/auth/email-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json() as { hashed_token?: string; error?: string }

    if (!res.ok || !data.hashed_token) {
      setEmailError(data.error ?? 'खाता बनाउन समस्या भयो। फेरि प्रयास गर्नुहोस्।')
      setEmailLoading(false)
      return
    }

    const supabase = createClient()
    const { error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: data.hashed_token,
      type: 'magiclink',
    })

    if (sessionError) {
      setEmailError('लगइन गर्न समस्या भयो। फेरि प्रयास गर्नुहोस्।')
      setEmailLoading(false)
      return
    }

    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-orange-600">पसलसाथी</CardTitle>
          <p className="text-sm text-gray-500">नयाँ खाता खोल्नुहोस्</p>
          <p className="text-xs text-orange-600 font-medium mt-1">३० दिन नि:शुल्क · क्रेडिट कार्ड आवश्यक छैन</p>
        </CardHeader>
        <CardContent>
          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Google बाट जारी राख्नुहोस्
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">वा</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <Tabs defaultValue="phone">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="phone" className="flex-1">📱 फोन नम्बर</TabsTrigger>
              <TabsTrigger value="email" className="flex-1">✉️ इमेल</TabsTrigger>
            </TabsList>

            {/* Phone OTP Tab */}
            <TabsContent value="phone" className="space-y-4">
              {!otpSent ? (
                <>
                  <div className="space-y-2">
                    <Label>फोन नम्बर</Label>
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
                    {phoneLoading ? 'पठाउँदैछ...' : 'OTP पठाउनुहोस्'}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 text-center">
                    <span className="font-medium">+977 {phone}</span> मा OTP पठाइयो
                  </p>
                  <div className="space-y-2">
                    <Label>OTP कोड</Label>
                    <Input
                      type="number"
                      placeholder="6 अंकको कोड"
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
                    {phoneLoading ? 'जाँच गर्दैछ...' : 'पुष्टि गर्नुहोस्'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); setPhoneError('') }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700"
                  >
                    नम्बर बदल्नुहोस्
                  </button>
                </>
              )}
            </TabsContent>

            {/* Email Tab */}
            <TabsContent value="email">
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">इमेल</Label>
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
                  <Label htmlFor="password">पासवर्ड</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="कम्तीमा ६ अक्षर"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                {emailError && (
                  <p className={`text-sm ${emailError.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
                    {emailError}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={emailLoading}
                >
                  {emailLoading ? 'बनाउँदैछ...' : 'खाता बनाउनुहोस्'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-4 text-center text-sm text-gray-600">
            पहिले नै खाता छ?{' '}
            <Link href="/login" className="text-orange-600 font-medium">
              लगइन गर्नुहोस्
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
