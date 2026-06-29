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

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/home')
    router.refresh()
  }

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-orange-500/50 text-base'

  const hint = (ok: boolean, label: string) => (
    <span className={ok ? 'text-green-400' : 'text-gray-600'}>{ok ? '✓' : '○'} {label}</span>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm bg-white/[0.04] border border-white/10 rounded-2xl shadow-2xl p-6 relative">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-xl font-bold text-white">Set new password</h1>
          <p className="text-sm text-gray-500 mt-1">Min 8 characters with at least 1 number</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-400">New password</label>
            <div className="relative">
              <input
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
            <label className="text-sm font-medium text-gray-400">Confirm password</label>
            <input
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

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] disabled:opacity-50 rounded-xl text-white font-semibold transition-all"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
