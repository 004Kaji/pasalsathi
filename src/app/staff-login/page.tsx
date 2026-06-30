'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Store } from 'lucide-react'

export default function StaffLoginPage() {
  const router = useRouter()
  const [businessCode, setBusinessCode] = useState('')
  const [name,         setName]         = useState('')
  const [pin,          setPin]          = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/staff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessCode, name, pin }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? 'Login failed'); return }
    router.replace('/sell')
  }

  const inp = 'w-full bg-white border border-[#D5CFC6] rounded-xl px-4 h-12 text-[#1C1917] placeholder:text-[#9B948E] outline-none focus:ring-2 focus:ring-[#C84B2F]/30 text-base'

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 bg-[#C84B2F] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#1C1917]">Staff Login</h1>
          <p className="text-sm text-[#6B6560] mt-1">Ask your owner for the Business Code</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            value={businessCode}
            onChange={e => setBusinessCode(e.target.value.toUpperCase())}
            placeholder="Business Code (e.g. A3B2C1)"
            className={inp}
            maxLength={6}
            required
          />
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your Name"
            className={inp}
            required
          />
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="4-digit PIN"
            className={inp}
            maxLength={4}
            required
          />

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#C84B2F] text-white rounded-xl font-bold text-base active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login to POS'}
          </button>
        </form>

        <p className="text-center text-xs text-[#9B948E]">
          Are you the owner?{' '}
          <a href="/login" className="text-[#C84B2F] font-semibold">Login here</a>
        </p>
      </div>
    </div>
  )
}
