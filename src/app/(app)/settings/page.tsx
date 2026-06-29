'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/supabase'
import { LogOut, Download, Trash2, KeyRound, Mail, Users, CreditCard, Gift, Copy, Check } from 'lucide-react'
import { PageSkeleton } from '@/components/ui/skeleton'
import type { Business } from '@/lib/types/database'

type Tab = 'business' | 'account' | 'subscription' | 'referral' | 'data' | 'team'

const TABS: { id: Tab; label: string; emoji?: string }[] = [
  { id: 'business',     label: 'Business'     },
  { id: 'account',      label: 'Account'      },
  { id: 'subscription', label: 'Subscription' },
  { id: 'referral',     label: 'Referral', emoji: '🎁' },
  { id: 'data',         label: 'Data'         },
  { id: 'team',         label: 'Team'         },
]

export default function SettingsPage() {
  const router = useRouter()

  const [tab,        setTab]        = useState<Tab>('business')
  const [business,   setBusiness]   = useState<Business | null>(null)
  const [userEmail,  setUserEmail]  = useState('')
  const [name,              setName]              = useState('')
  const [phone,             setPhone]             = useState('')
  const [address,           setAddress]           = useState('')
  const [panNumber,         setPanNumber]         = useState('')
  const [vatNumber,         setVatNumber]         = useState('')
  const [businessRegNumber, setBusinessRegNumber] = useState('')
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [exporting,      setExporting]      = useState(false)
  const [clearStep,      setClearStep]      = useState<'idle' | 'confirm' | 'clearing'>('idle')
  const [referralCode,   setReferralCode]   = useState('')
  const [referralCount,  setReferralCount]  = useState(0)
  const [monthsEarned,   setMonthsEarned]   = useState(0)
  const [copied,         setCopied]         = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserEmail(user.email ?? '')
      const { data: biz } = await supabase.from('businesses').select('*').eq('owner_id', user.id).single()
      if (biz) {
        const b = biz as Business & { referral_code?: string; months_earned?: number }
        setBusiness(b as Business)
        setName(b.name)
        setPhone(b.phone ?? '')
        setAddress(b.address ?? '')
        setPanNumber(b.pan_number ?? '')
        setVatNumber(b.vat_number ?? '')
        setBusinessRegNumber(b.business_reg_number ?? '')
        setReferralCode(b.referral_code ?? '')
        setMonthsEarned(b.months_earned ?? 0)

        const { count } = await supabase
          .from('referrals').select('id', { count: 'exact', head: true })
          .eq('referrer_id', b.id)
        setReferralCount(count ?? 0)
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
      name: name.trim(),
      phone: phone.trim() || null,
      address: address.trim() || null,
      pan_number: panNumber.trim() || null,
      vat_number: vatNumber.trim() || null,
      business_reg_number: businessRegNumber.trim() || null,
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

  if (loading) return <div className="pt-6 px-4"><PageSkeleton rows={4} /></div>

  const inp = 'w-full bg-white border border-[#D5CFC6] rounded-xl px-4 h-12 text-[#1C1917] placeholder:text-[#9B948E] outline-none focus:border-[#C84B2F] focus:ring-2 focus:ring-[#C84B2F]/20 text-base transition-all'

  return (
    <div className="pb-12">

      {/* Page header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-[#1C1917] font-display">Settings</h1>
        {business && <p className="text-sm text-[#9B948E] mt-0.5">{business.name}</p>}
      </div>

      {/* Tab bar */}
      <div className="border-b border-[#D5CFC6] px-4">
        <div className="flex gap-0 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-[#1C1917] text-[#1C1917]'
                  : 'border-transparent text-[#9B948E] hover:text-[#6B6560]'
              }`}
            >
              {t.label}{t.emoji ? ` ${t.emoji}` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 pt-6 space-y-4">

        {/* BUSINESS */}
        {tab === 'business' && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="bg-white border border-[#D5CFC6] rounded-2xl p-5 space-y-4 shadow-sm">
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

            <div className="bg-white border border-[#D5CFC6] rounded-2xl p-5 space-y-4 shadow-sm">
              <p className="text-xs font-bold text-[#9B948E] uppercase tracking-widest">Tax &amp; Registration (Optional)</p>
              <div>
                <label className="text-xs font-semibold text-[#6B6560] block mb-1.5">PAN Number</label>
                <input placeholder="9-digit PAN number" value={panNumber} onChange={e => setPanNumber(e.target.value)} className={inp} maxLength={9} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6B6560] block mb-1.5">VAT Number</label>
                <input placeholder="VAT registration number" value={vatNumber} onChange={e => setVatNumber(e.target.value)} className={inp} />
                <p className="text-xs text-[#9B948E] mt-1">13% VAT will be added to receipts when this is set</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6B6560] block mb-1.5">Business Registration No.</label>
                <input placeholder="Company reg number" value={businessRegNumber} onChange={e => setBusinessRegNumber(e.target.value)} className={inp} />
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
        )}

        {/* ACCOUNT */}
        {tab === 'account' && (
          <div className="bg-white border border-[#D5CFC6] rounded-2xl overflow-hidden shadow-sm">
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
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-[#F5F0E8]">
              <LogOut size={18} className="text-[#C84B2F] shrink-0" />
              <span className="flex-1 text-sm font-semibold text-[#C84B2F]">Logout</span>
            </button>
          </div>
        )}

        {/* SUBSCRIPTION */}
        {tab === 'subscription' && (
          <div className="space-y-4">

            {/* Current plan */}
            <div className="bg-[#4A7055]/10 border border-[#4A7055]/20 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#4A7055] uppercase tracking-widest mb-1">Current Plan</p>
                <p className="text-lg font-bold text-[#1C1917]">Free</p>
                <p className="text-xs text-[#9B948E] mt-0.5">Unlimited during beta period</p>
              </div>
              <div className="w-10 h-10 bg-[#4A7055]/15 rounded-xl flex items-center justify-center">
                <CreditCard size={20} className="text-[#4A7055]" />
              </div>
            </div>

            {/* Plan cards */}
            {[
              {
                key: 'sano', nameNp: 'सानो', nameEn: 'Sano', price: 499, popular: false,
                features: ['Up to 2 staff', '50 customers', '100 products', '20 SMS/month', 'Basic reports'],
              },
              {
                key: 'madhyam', nameNp: 'मध्यम', nameEn: 'Madhyam', price: 1199, popular: true,
                features: ['Up to 10 staff', '300 customers', '500 products', '100 SMS/month', 'PDF reports'],
              },
            ].map(plan => (
              <div key={plan.key} className={`relative bg-white border rounded-2xl p-5 shadow-sm ${
                plan.popular ? 'border-[#C84B2F]/30 ring-1 ring-[#C84B2F]/20' : 'border-[#D5CFC6]'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-5 bg-[#C84B2F] text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      plan.popular ? 'bg-[#C84B2F]/10 text-[#C84B2F]' : 'bg-[#4A7055]/10 text-[#4A7055]'
                    }`}>{plan.nameNp}</span>
                    <p className="text-2xl font-black text-[#1C1917] mt-2">
                      NPR {plan.price.toLocaleString('en-IN')}
                      <span className="text-sm font-normal text-[#9B948E]">/mo</span>
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 mb-4">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#6B6560]">
                      <span className="w-4 h-4 rounded-full bg-[#4A7055]/15 flex items-center justify-center shrink-0">
                        <span className="text-[#4A7055] text-[10px] font-bold">✓</span>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    window.open(`mailto:pasalsathi@gmail.com?subject=Upgrade to ${plan.nameEn} Plan&body=Hi, I want to upgrade to the ${plan.nameEn} plan (NPR ${plan.price}/month). My business: ${business?.name ?? ''}`, '_blank')
                  }}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
                    plan.popular
                      ? 'bg-[#C84B2F] text-white hover:opacity-90'
                      : 'bg-[#F5F0E8] text-[#1C1917] hover:bg-[#EDE8DF] border border-[#D5CFC6]'
                  }`}
                >
                  Upgrade to {plan.nameNp}
                </button>
              </div>
            ))}

            <p className="text-xs text-center text-[#9B948E] px-2">
              Online payment (Khalti / eSewa) coming soon. For now, tap Upgrade to contact us.
            </p>
          </div>
        )}

        {/* REFERRAL */}
        {tab === 'referral' && (
          <div className="space-y-4">

            {/* Hero card */}
            <div className="bg-gradient-to-br from-[#4A7055] to-emerald-700 rounded-2xl p-6 text-white shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🎁</span>
                <div>
                  <h2 className="text-lg font-bold">Invite Friends, Earn Free Months</h2>
                  <p className="text-sm text-white/75">साथीलाई बोलाउनुस्, फाइदा लिनुस्!</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white/15 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold">{referralCount}</p>
                  <p className="text-xs text-white/75">Friends joined</p>
                </div>
                <div className="bg-white/15 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold">{monthsEarned}</p>
                  <p className="text-xs text-white/75">Free months earned</p>
                </div>
              </div>
              {referralCount >= 5 && (
                <div className="mt-3 bg-yellow-400/20 border border-yellow-300/30 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span>🏆</span>
                  <p className="text-sm font-semibold text-yellow-100">PasalSathi Partner — 5+ referrals!</p>
                </div>
              )}
            </div>

            {/* Referral code + share */}
            <div className="bg-white border border-[#D5CFC6] rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <p className="text-xs font-semibold text-[#6B6560] mb-2">Your referral code</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#F5F0E8] border border-[#D5CFC6] rounded-xl px-4 py-3">
                    <p className="text-xl font-mono font-bold text-[#C84B2F] tracking-widest">
                      {referralCode || '------'}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      const link = `https://pasalsathi.net/signup?ref=${referralCode}`
                      await navigator.clipboard.writeText(link)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="p-3 bg-[#F5F0E8] border border-[#D5CFC6] rounded-xl text-[#6B6560] hover:text-[#1C1917] active:scale-95 transition-all"
                  >
                    {copied ? <Check size={20} className="text-[#4A7055]" /> : <Copy size={20} />}
                  </button>
                </div>
                {copied && <p className="text-xs text-[#4A7055] mt-1 font-semibold">Link copied!</p>}
              </div>

              {/* WhatsApp share — Nepal's primary channel */}
              <button
                onClick={() => {
                  const msg = encodeURIComponent(
                    `नमस्ते! 🙏\n\nमैले PasalSathi प्रयोग गर्दैछु — Nepal को लागि सबैभन्दा राम्रो POS र हिसाब किताब app।\n\n✅ बिक्री, invoice, payslip सबै एकै ठाउँमा\n✅ Nepali calendar (BS) support\n✅ Nepali मा SMS reminder\n\nMero referral code: ${referralCode}\nSign up गर्नुहोस् र 45 दिन FREE पाउनुहोस्!\n\n👉 https://pasalsathi.net/signup?ref=${referralCode}`
                  )
                  window.open(`https://wa.me/?text=${msg}`, '_blank')
                }}
                className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1FB855] active:scale-[0.98] text-white rounded-xl py-3.5 font-semibold transition-all"
              >
                <span className="text-xl">💬</span>
                Share on WhatsApp
              </button>

              <button
                onClick={() => {
                  const link = `https://pasalsathi.net/signup?ref=${referralCode}`
                  if (navigator.share) {
                    navigator.share({ title: 'PasalSathi', text: `Join PasalSathi with my code ${referralCode} and get 45 days free!`, url: link })
                  } else {
                    navigator.clipboard.writeText(link)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }
                }}
                className="w-full flex items-center justify-center gap-2 border border-[#D5CFC6] rounded-xl py-3 text-sm text-[#6B6560] hover:bg-[#F5F0E8] active:scale-[0.98] transition-all"
              >
                Share via other apps
              </button>
            </div>

            {/* How it works */}
            <div className="bg-white border border-[#D5CFC6] rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#1C1917] mb-3">How it works</h3>
              <div className="space-y-3">
                {[
                  { step: '1', text: 'Share your code with a friend', sub: 'WhatsApp, Viber, in person — anywhere' },
                  { step: '2', text: 'They sign up using your link', sub: 'They get 45 days free (15 bonus days)' },
                  { step: '3', text: 'You earn 1 free month', sub: 'Per friend who joins — no limit!' },
                ].map(s => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#4A7055]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-[#4A7055]">{s.step}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1C1917]">{s.text}</p>
                      <p className="text-xs text-[#9B948E]">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* DATA */}
        {tab === 'data' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#D5CFC6] rounded-2xl overflow-hidden shadow-sm">
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
            </div>
          </div>
        )}

        {/* TEAM */}
        {tab === 'team' && (
          <div className="bg-white border border-[#D5CFC6] rounded-2xl overflow-hidden shadow-sm">
            <Link href="/settings/users" className="flex items-center justify-between px-5 py-5 active:bg-[#F5F0E8]">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 rounded-xl p-2.5"><Users size={20} className="text-blue-600" /></div>
                <div>
                  <p className="text-sm font-semibold text-[#1C1917]">Team Members</p>
                  <p className="text-xs text-[#9B948E] mt-0.5">Give staff access to PasalSathi</p>
                </div>
              </div>
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
