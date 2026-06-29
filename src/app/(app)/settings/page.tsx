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
      const { data: biz } = await supabase.from('businesses').select('*').eq('owner_id', user.id).single()
      if (biz) {
        const b = biz as Business
        setBusiness(b); setName(b.name); setPhone(b.phone ?? ''); setAddress(b.address ?? '')
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
      name: name.trim(), phone: phone.trim() || null, address: address.trim() || null,
    }).eq('id', business.id)
    if (error) { setSaving(false); alert('Save failed: ' + error.message); return }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login'); router.refresh()
  }

  async function handleExportAll() {
    if (!business) return
    setExporting(true)
    const supabase = createClient()
    const { data: txs } = await supabase.from('transactions').select('*')
      .eq('business_id', business.id).order('created_at', { ascending: false })
    if (!txs || txs.length === 0) { alert('No transactions to export yet.'); setExporting(false); return }
    const headers = ['Date', 'Type', 'Item', 'Amount', 'Payment Method']
    const rows = txs.map(t => [
      new Date(t.created_at).toLocaleDateString('en-NP'), t.type,
      `"${(t.item_name ?? '').replace(/"/g, '""')}"`, t.amount, t.payment_method ?? '',
    ])
    const csv  = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `pasalsathi-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url); setExporting(false)
  }

  async function handleClearData() {
    if (!business) return
    setClearStep('clearing')
    const supabase = createClient()
    await Promise.all([
      supabase.from('khata_entries').delete().eq('business_id', business.id),
      supabase.from('transactions').delete().eq('business_id', business.id),
    ])
    await supabase.from('customers').update({ balance: 0 }).eq('business_id', business.id)
    setClearStep('idle'); alert('All transaction data cleared.')
  }

  if (loading) return <div className="min-h-screen bg-[#F5F0E8] pt-16"><PageSkeleton rows={4} /></div>

  const inp = 'w-full bg-white border border-[#D5CFC6] rounded-xl px-4 h-12 text-[#1C1917] placeholder:text-[#9B948E] outline-none focus:border-[#C84B2F] focus:ring-2 focus:ring-[#C84B2F]/20 text-base transition-all'

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-32">

      {/* Header */}
      <div className="sticky top-0 bg-[#F5F0E8]/90 backdrop-blur-xl border-b border-[#D5CFC6] z-10 px-4 pt-5 pb-4">
        <h1 className="text-2xl font-bold text-[#1C1917] font-display">Settings</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Account */}
        <section className="bg-white border border-[#D5CFC6] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-[#E0D9CE]">
            <p className="text-xs font-bold text-[#9B948E] uppercase tracking-widest">Account</p>
          </div>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E0D9CE]">
            <Mail size={18} className="text-[#9B948E] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#9B948E] font-medium">Email</p>
              <p className="text-sm text-[#1C1917] truncate mt-0.5 font-mono">{userEmail || '—'}</p>
            </div>
          </div>
          <Link href="/forgot-password" className="flex items-center gap-3 px-5 py-4 border-b border-[#E0D9CE] active:bg-[#F5F0E8]">
            <KeyRound size={18} className="text-[#9B948E] shrink-0" />
            <span className="flex-1 text-sm font-semibold text-[#1C1917]">Change Password</span>
            <ChevronRight size={16} className="text-[#9B948E]" />
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-[#F5F0E8]">
            <LogOut size={18} className="text-[#C84B2F] shrink-0" />
            <span className="flex-1 text-sm font-semibold text-[#C84B2F]">Logout</span>
          </button>
        </section>

        {/* Quick links */}
        <section className="bg-white border border-[#D5CFC6] rounded-2xl overflow-hidden shadow-sm divide-y divide-[#E0D9CE]">
          <Link href="/settings/billing" className="flex items-center justify-between px-5 py-4 active:bg-[#F5F0E8]">
            <div className="flex items-center gap-3">
              <div className="bg-[#C84B2F]/10 rounded-xl p-2"><CreditCard size={18} className="text-[#C84B2F]" /></div>
              <div>
                <p className="text-sm font-semibold text-[#1C1917]">Billing & Plan</p>
                <p className="text-xs text-[#9B948E]">Manage subscription</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#9B948E]" />
          </Link>
          <Link href="/settings/users" className="flex items-center justify-between px-5 py-4 active:bg-[#F5F0E8]">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 rounded-xl p-2"><Users size={18} className="text-blue-600" /></div>
              <div>
                <p className="text-sm font-semibold text-[#1C1917]">Team Members</p>
                <p className="text-xs text-[#9B948E]">Give staff access</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#9B948E]" />
          </Link>
        </section>

        {/* Business Info */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-white border border-[#D5CFC6] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-[#E0D9CE] flex items-center gap-2">
              <Building2 size={16} className="text-[#9B948E]" />
              <p className="text-xs font-bold text-[#9B948E] uppercase tracking-widest">Business Info</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#6B6560] block mb-1.5">Business Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} className={inp} required placeholder="Ram Kirana Pasal" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6B6560] block mb-1.5">Phone</label>
                <input type="tel" placeholder="98XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} className={inp} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6B6560] block mb-1.5">Address</label>
                <input placeholder="New Road, Kathmandu" value={address} onChange={e => setAddress(e.target.value)} className={inp} />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className={`w-full py-4 rounded-2xl font-bold text-base active:scale-[0.98] transition-all disabled:opacity-60 text-white ${
              saved ? 'bg-[#4A7055]' : 'bg-[#C84B2F]'
            }`}
          >
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Data */}
        <section className="bg-white border border-[#D5CFC6] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-[#E0D9CE]">
            <p className="text-xs font-bold text-[#9B948E] uppercase tracking-widest">Data</p>
          </div>
          <button onClick={handleExportAll} disabled={exporting}
            className="w-full flex items-center gap-3 px-5 py-4 border-b border-[#E0D9CE] active:bg-[#F5F0E8] disabled:opacity-50">
            <Download size={18} className="text-[#4A7055] shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-[#1C1917]">Export All Data</p>
              <p className="text-xs text-[#9B948E] mt-0.5">Download transactions as CSV</p>
            </div>
            {exporting && <div className="w-4 h-4 border-2 border-[#4A7055]/50 border-t-[#4A7055] rounded-full animate-spin" />}
          </button>

          {clearStep === 'idle' && (
            <button onClick={() => setClearStep('confirm')} className="w-full flex items-center gap-3 px-5 py-4 active:bg-[#F5F0E8]">
              <Trash2 size={18} className="text-[#C84B2F] shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-[#C84B2F]">Clear All Data</p>
                <p className="text-xs text-[#9B948E] mt-0.5">Delete all transactions & reset balances</p>
              </div>
            </button>
          )}
          {clearStep === 'confirm' && (
            <div className="px-5 py-4 bg-[#C84B2F]/5 border-t border-[#C84B2F]/20">
              <p className="text-sm font-semibold text-[#C84B2F] mb-1">Delete all transactions?</p>
              <p className="text-xs text-[#9B948E] mb-3">Removes all sales, expenses, and resets customer balances. Cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setClearStep('idle')}
                  className="flex-1 py-2.5 rounded-xl border border-[#D5CFC6] text-[#6B6560] text-sm font-semibold">Cancel</button>
                <button onClick={handleClearData}
                  className="flex-1 py-2.5 rounded-xl bg-[#C84B2F] text-white text-sm font-bold">Yes, Delete</button>
              </div>
            </div>
          )}
          {clearStep === 'clearing' && (
            <div className="px-5 py-4 text-center">
              <p className="text-sm text-[#6B6560]">Clearing data...</p>
            </div>
          )}
        </section>

        {/* About */}
        <section className="bg-white border border-[#D5CFC6] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-[#E0D9CE]">
            <p className="text-xs font-bold text-[#9B948E] uppercase tracking-widest">About</p>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#C84B2F] rounded-xl flex items-center justify-center text-white font-bold text-sm font-display">PS</div>
              <div>
                <p className="text-sm font-bold text-[#1C1917]">PasalSathi</p>
                <p className="text-xs text-[#9B948E]">Version 1.0.0</p>
              </div>
            </div>
            <p className="text-xs text-[#9B948E]">Nepali Business App</p>
          </div>
        </section>

      </div>
    </div>
  )
}
