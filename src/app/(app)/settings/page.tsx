'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/supabase'
import { Building2, LogOut, Download, Trash2, CreditCard, Users, ChevronRight, KeyRound, Mail } from 'lucide-react'
import { PageSkeleton } from '@/components/ui/skeleton'
import type { Business } from '@/lib/types/database'

export default function SettingsPage() {
  const router = useRouter()

  const [business,   setBusiness]   = useState<Business | null>(null)
  const [userEmail,  setUserEmail]  = useState('')
  const [name,       setName]       = useState('')
  const [phone,      setPhone]      = useState('')
  const [address,    setAddress]    = useState('')
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [exporting,  setExporting]  = useState(false)
  const [clearStep,  setClearStep]  = useState<'idle' | 'confirm' | 'clearing'>('idle')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      setUserEmail(user.email ?? '')

      const { data: biz } = await supabase
        .from('businesses').select('*').eq('owner_id', user.id).single()

      if (biz) {
        const b = biz as Business
        setBusiness(b)
        setName(b.name)
        setPhone(b.phone ?? '')
        setAddress(b.address ?? '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!business) return
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase.from('businesses').update({
      name:    name.trim(),
      phone:   phone.trim() || null,
      address: address.trim() || null,
    }).eq('id', business.id)

    if (error) { setSaving(false); alert('Save failed: ' + error.message); return }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleExportAll() {
    if (!business) return
    setExporting(true)

    const supabase = createClient()
    const { data: txs } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })

    if (!txs || txs.length === 0) {
      alert('No transactions to export yet.')
      setExporting(false)
      return
    }

    const headers = ['Date', 'Type', 'Item', 'Amount', 'Payment Method']
    const rows = txs.map(t => [
      new Date(t.created_at).toLocaleDateString('en-NP'),
      t.type,
      `"${(t.item_name ?? '').replace(/"/g, '""')}"`,
      t.amount,
      t.payment_method ?? '',
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `pasalsathi-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  async function handleClearData() {
    if (!business) return
    setClearStep('clearing')

    const supabase = createClient()
    await Promise.all([
      supabase.from('khata_entries').delete().eq('business_id', business.id),
      supabase.from('transactions').delete().eq('business_id', business.id),
    ])
    // Reset all customer balances
    await supabase.from('customers').update({ balance: 0 }).eq('business_id', business.id)

    setClearStep('idle')
    alert('All transaction data cleared.')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] pt-16">
      <PageSkeleton rows={4} />
    </div>
  )

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-white placeholder:text-gray-600 outline-none focus:border-orange-500/50 text-base"

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">

      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 z-10 px-4 pt-5 pb-4">
        <h1 className="text-2xl font-bold text-white">⚙️ Settings</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* ── Account ── */}
        <section className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Account</p>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
            <Mail size={18} className="text-gray-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium">Email</p>
              <p className="text-sm text-white truncate mt-0.5">{userEmail || '—'}</p>
            </div>
          </div>

          {/* Change password */}
          <Link
            href="/forgot-password"
            className="flex items-center gap-3 px-5 py-4 border-b border-white/5 active:bg-white/5"
          >
            <KeyRound size={18} className="text-gray-500 shrink-0" />
            <span className="flex-1 text-sm font-semibold text-white">Change Password</span>
            <ChevronRight size={16} className="text-gray-600" />
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-white/5"
          >
            <LogOut size={18} className="text-red-400 shrink-0" />
            <span className="flex-1 text-sm font-semibold text-red-400">Logout</span>
          </button>
        </section>

        {/* ── Quick links ── */}
        <section className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
          <Link href="/settings/billing" className="flex items-center justify-between px-5 py-4 active:bg-white/5">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500/20 rounded-xl p-2"><CreditCard size={18} className="text-orange-400" /></div>
              <div>
                <p className="text-sm font-semibold text-white">Billing & Plan</p>
                <p className="text-xs text-gray-500">Manage subscription</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-600" />
          </Link>
          <Link href="/settings/users" className="flex items-center justify-between px-5 py-4 active:bg-white/5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 rounded-xl p-2"><Users size={18} className="text-blue-400" /></div>
              <div>
                <p className="text-sm font-semibold text-white">Team Members</p>
                <p className="text-xs text-gray-500">Give staff access</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-600" />
          </Link>
        </section>

        {/* ── Business Info ── */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
              <Building2 size={16} className="text-gray-500" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Business Info</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Business Name *</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className={inputClass} required placeholder="Ram Kirana Pasal" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Phone</label>
                <input type="tel" placeholder="98XXXXXXXX" value={phone}
                  onChange={e => setPhone(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Address</label>
                <input placeholder="New Road, Kathmandu" value={address}
                  onChange={e => setAddress(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`w-full py-4 rounded-2xl font-bold text-base active:scale-[0.98] transition-all disabled:opacity-60 ${
              saved ? 'bg-green-600 text-white' : 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
            }`}
          >
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* ── Data ── */}
        <section className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data</p>
          </div>

          {/* Export */}
          <button
            onClick={handleExportAll}
            disabled={exporting}
            className="w-full flex items-center gap-3 px-5 py-4 border-b border-white/5 active:bg-white/5 disabled:opacity-50"
          >
            <Download size={18} className="text-green-400 shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">Export All Data</p>
              <p className="text-xs text-gray-500 mt-0.5">Download transactions as CSV</p>
            </div>
            {exporting && <div className="w-4 h-4 border-2 border-green-400/50 border-t-green-400 rounded-full animate-spin" />}
          </button>

          {/* Clear data */}
          {clearStep === 'idle' && (
            <button
              onClick={() => setClearStep('confirm')}
              className="w-full flex items-center gap-3 px-5 py-4 active:bg-white/5"
            >
              <Trash2 size={18} className="text-red-400 shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-red-400">Clear All Data</p>
                <p className="text-xs text-gray-500 mt-0.5">Delete all transactions & reset balances</p>
              </div>
            </button>
          )}

          {clearStep === 'confirm' && (
            <div className="px-5 py-4 bg-red-500/10 border-t border-red-500/20">
              <p className="text-sm font-semibold text-red-400 mb-1">Delete all transactions?</p>
              <p className="text-xs text-gray-500 mb-3">
                This removes all sales, expenses, and resets customer balances. Cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setClearStep('idle')}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearData}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          )}

          {clearStep === 'clearing' && (
            <div className="px-5 py-4 text-center">
              <p className="text-sm text-gray-400">Clearing data...</p>
            </div>
          )}
        </section>

        {/* ── About ── */}
        <section className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">About</p>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">PS</div>
              <div>
                <p className="text-sm font-bold text-white">PasalSathi</p>
                <p className="text-xs text-gray-500">Version 1.0.0</p>
              </div>
            </div>
            <p className="text-xs text-gray-600">Nepali Business App</p>
          </div>
        </section>

      </div>
    </div>
  )
}
