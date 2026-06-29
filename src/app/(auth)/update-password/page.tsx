'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/supabase'
import { Eye, EyeOff } from 'lucide-react'

function getPasswordError(pwd: string): string {
  if (pwd.length < 8) return 'Password must be at least 8 characters'
  if (!/\d/.test(pwd)) return 'Password must contain at least 1 number'
  return ''
}

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const pwdError = getPasswordError(password)
    if (pwdError) { setError(pwdError); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) { setError(updateError.message); setLoading(false); return }
    router.push('/home')
    router.refresh()
  }

  const inputClass = 'w-full bg-white border border-[#D5CFC6] rounded-xl px-4 h-12 text-[#1C1917] placeholder:text-[#9B948E] outline-none focus:ring-2 focus:ring-[#C84B2F]/30 focus:border-[#C84B2F] text-base transition-all'
  const hint = (ok: boolean, label: string) => (
    <span className={ok ? 'text-[#4A7055]' : 'text-[#9B948E]'}>{ok ? '✓' : '○'} {label}</span>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8] px-4">
      <div className="w-full max-w-sm bg-white border border-[#D5CFC6] rounded-2xl shadow-sm p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#C84B2F]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-xl font-bold text-[#1C1917]">Set new password</h1>
          <p className="text-sm text-[#6B6560] mt-1">Min 8 characters with at least 1 number</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#6B6560]">New password</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} placeholder="Min 8 chars, 1 number"
                value={password} onChange={e => setPassword(e.target.value)} required className={inputClass + ' pr-12'} />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B948E] hover:text-[#6B6560]">
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#6B6560]">Confirm password</label>
            <input type={showPwd ? 'text' : 'password'} placeholder="Repeat password"
              value={confirm} onChange={e => setConfirm(e.target.value)} required className={inputClass} />
          </div>

          <div className="flex gap-4 text-xs">
            {hint(password.length >= 8, '8+ chars')}
            {hint(/\d/.test(password), '1 number')}
            {hint(Boolean(confirm) && password === confirm, 'match')}
          </div>

          {error && <p className="text-sm text-[#C84B2F]">{error}</p>}

          <button type="submit" disabled={loading || !password || !confirm}
            className="w-full py-3 bg-[#C84B2F] hover:bg-[#E05A3A] active:scale-[0.98] disabled:opacity-50 rounded-xl text-white font-semibold transition-all">
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
