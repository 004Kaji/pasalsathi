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

    router.push('/dashboard')
    router.refresh()
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setEmailError('')
    setEmailLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setEmailError('इमेल वा पासवर्ड गलत छ')
      setEmailLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-orange-600">मेरो हिसाब</CardTitle>
          <p className="text-sm text-gray-500">आफ्नो खातामा लगइन गर्नुहोस्</p>
        </CardHeader>
        <CardContent>
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
                    {phoneLoading ? 'जाँच गर्दैछ...' : 'लगइन गर्नुहोस्'}
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
              <form onSubmit={handleEmailLogin} className="space-y-4">
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
                    placeholder="पासवर्ड"
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
                  {emailLoading ? 'लगइन हुँदैछ...' : 'लगइन गर्नुहोस्'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-4 text-center text-sm text-gray-600">
            खाता छैन?{' '}
            <Link href="/signup" className="text-orange-600 font-medium">
              दर्ता गर्नुहोस्
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
