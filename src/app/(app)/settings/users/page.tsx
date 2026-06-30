'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/supabase'
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react'
import type { Staff } from '@/lib/types/database'

export default function UsersPage() {
  const router = useRouter()
  const [staffList,    setStaffList]    = useState<Staff[]>([])
  const [businessCode, setBusinessCode] = useState('')
  const [loading,      setLoading]      = useState(true)
  const [showAdd,      setShowAdd]      = useState(false)
  const [newName,      setNewName]      = useState('')
  const [newPin,       setNewPin]       = useState('')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')

  const fetchStaff = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: biz } = await supabase.from('businesses').select('id, referral_code').eq('owner_id', user.id).single()
    if (!biz) return
    setBusinessCode(biz.referral_code ?? '')
    const { data } = await supabase.from('staff').select('*').eq('business_id', biz.id).eq('active', true).order('created_at')
    setStaffList((data as Staff[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchStaff() }, [fetchStaff])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!/^\d{4}$/.test(newPin)) { setError('PIN must be exactly 4 digits'); return }
    setSaving(true)
    const res = await fetch('/api/staff/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, pin: newPin }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    setNewName(''); setNewPin(''); setShowAdd(false)
    fetchStaff()
  }

  async function handleRemove(staffId: string) {
    await fetch('/api/staff/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId }),
    })
    setStaffList(prev => prev.filter(s => s.id !== staffId))
  }

  const inp = 'w-full bg-[#F5F0E8] border border-[#D5CFC6] rounded-xl px-4 h-11 text-[#1C1917] placeholder:text-[#9B948E] outline-none focus:ring-2 focus:ring-[#C84B2F]/30 text-sm'

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-10">
      <div className="bg-[#1C1917] px-4 pt-5 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/10 text-white active:scale-95">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-white">Team Members</h1>
          </div>
          <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-1.5 bg-[#C84B2F] text-white text-sm font-bold px-3 py-2 rounded-xl active:scale-95">
            <Plus size={16} /> Add Staff
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Business code — staff use this to log in */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">Business Code</p>
          <p className="text-2xl font-black text-[#1C1917] tracking-widest">{businessCode || '—'}</p>
          <p className="text-xs text-amber-700 mt-1">Share with staff to log in at <strong>pasalsathi.net/staff-login</strong></p>
        </div>

        {/* Add staff form */}
        {showAdd && (
          <form onSubmit={handleAdd} className="bg-white border border-[#D5CFC6] rounded-2xl p-5 space-y-3 shadow-sm">
            <p className="font-bold text-[#1C1917]">New Staff Member</p>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name" className={inp} required />
            <input
              type="password" inputMode="numeric"
              value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4-digit PIN" className={inp} maxLength={4} required
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-[#D5CFC6] text-[#6B6560] text-sm font-semibold">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#C84B2F] text-white text-sm font-bold disabled:opacity-50">
                {saving ? 'Adding...' : 'Add Staff'}
              </button>
            </div>
          </form>
        )}

        {/* Empty state */}
        {!loading && staffList.length === 0 && !showAdd && (
          <div className="text-center py-10">
            <Users size={40} className="text-[#D5CFC6] mx-auto mb-3" />
            <p className="text-[#9B948E] text-sm">No staff yet. Add your first team member.</p>
          </div>
        )}

        {/* Staff list */}
        {staffList.length > 0 && (
          <div className="bg-white border border-[#D5CFC6] rounded-2xl overflow-hidden shadow-sm">
            {staffList.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-4 px-5 py-4 ${i < staffList.length - 1 ? 'border-b border-[#E0D9CE]' : ''}`}>
                <div className="bg-[#C84B2F]/10 rounded-full w-10 h-10 flex items-center justify-center shrink-0">
                  <span className="text-[#C84B2F] font-black text-base">{s.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#1C1917]">{s.name}</p>
                  <p className="text-xs text-[#9B948E]">POS access · PIN protected</p>
                </div>
                <button onClick={() => handleRemove(s.id)} className="p-2 rounded-xl text-red-400 active:bg-red-50">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
