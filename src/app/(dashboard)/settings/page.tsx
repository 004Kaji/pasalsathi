'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Building2, CreditCard, Users, LogOut, ChevronRight, Package, ToggleLeft, ToggleRight,
} from 'lucide-react'
import type { Business, BusinessType } from '@/types/database'

const BUSINESS_TYPES: { value: BusinessType; label: string; emoji: string; stockDefault: boolean }[] = [
  { value: 'kirana',     label: 'Grocery / Kirana', emoji: '🏪', stockDefault: true  },
  { value: 'hardware',   label: 'Hardware',          emoji: '🔧', stockDefault: true  },
  { value: 'pharmacy',   label: 'Pharmacy',          emoji: '💊', stockDefault: true  },
  { value: 'clothing',   label: 'Clothing Store',    emoji: '👗', stockDefault: true  },
  { value: 'wholesale',  label: 'Wholesale',         emoji: '📦', stockDefault: true  },
  { value: 'restaurant', label: 'Restaurant / Cafe', emoji: '🍽️', stockDefault: false },
  { value: 'service',    label: 'Service / Repair',  emoji: '🛠️', stockDefault: false },
  { value: 'salon',      label: 'Salon / Beauty',    emoji: '✂️', stockDefault: false },
  { value: 'hotel',      label: 'Hotel / Lodge',     emoji: '🏨', stockDefault: false },
  { value: 'other',      label: 'Other',             emoji: '🏢', stockDefault: true  },
]

const PLAN_LABELS: Record<string, string> = {
  sano: 'Sano (Free)', madhyam: 'Madhyam', thulo: 'Thulo',
}

export default function SettingsPage() {
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [name,       setName]       = useState('')
  const [type,       setType]       = useState<BusinessType>('kirana')
  const [phone,      setPhone]      = useState('')
  const [address,    setAddress]    = useState('')
  const [panNumber,  setPanNumber]  = useState('')
  const [trackStock, setTrackStock] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: biz } = await supabase
        .from('businesses').select('*').eq('owner_id', user.id).single()

      if (biz) {
        const b = biz as Business
        setBusiness(b)
        setName(b.name)
        setType((b.type as BusinessType) ?? 'kirana')
        setPhone(b.phone ?? '')
        setAddress(b.address ?? '')
        setPanNumber(b.pan_number ?? '')
        // track_stock may not exist in DB yet — default to true
        const ts = (b as unknown as Record<string, unknown>).track_stock
        setTrackStock(ts === false ? false : true)
      }
      setLoading(false)
    }
    load()
  }, [])

  // When business type changes, auto-suggest stock tracking
  function handleTypeChange(bt: typeof BUSINESS_TYPES[number]) {
    setType(bt.value)
    setTrackStock(bt.stockDefault)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!business) return
    setSaving(true)

    const supabase = createClient()

    // Base fields — always exist in DB
    const { error } = await supabase.from('businesses').update({
      name:       name.trim(),
      type,
      phone:      phone.trim() || null,
      address:    address.trim() || null,
      pan_number: panNumber.trim() || null,
    }).eq('id', business.id)

    if (error) {
      setSaving(false)
      alert('Save failed: ' + error.message)
      return
    }

    // track_stock — column may not exist until SQL migration is run
    // Try silently; won't break anything if it fails
    await supabase.from('businesses').update({ track_stock: trackStock }).eq('id', business.id)

    // Persist to localStorage so bottom nav can read it immediately
    localStorage.setItem('ps_track_stock', trackStock ? '1' : '0')

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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-gray-400 text-lg">
      Loading...
    </div>
  )

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-orange-500/50 text-base"

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 z-10 px-4 pt-5 pb-4">
        <h1 className="text-2xl font-bold text-white">⚙️ Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Business info & preferences</p>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Quick links */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
          <Link href="/settings/billing" className="flex items-center justify-between px-5 py-4 active:bg-white/5">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500/20 rounded-xl p-2.5"><CreditCard size={20} className="text-orange-400" /></div>
              <div>
                <p className="text-base font-semibold text-white">Billing & Plan</p>
                <p className="text-sm text-gray-500">Current: {PLAN_LABELS[business?.plan ?? 'sano']}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-600" />
          </Link>
          <Link href="/settings/users" className="flex items-center justify-between px-5 py-4 active:bg-white/5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 rounded-xl p-2.5"><Users size={20} className="text-blue-400" /></div>
              <div>
                <p className="text-base font-semibold text-white">Team Members</p>
                <p className="text-sm text-gray-500">Give staff app access</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-600" />
          </Link>
        </div>

        {/* Business profile */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-5">
            <div className="flex items-center gap-2">
              <Building2 size={20} className="text-gray-400" />
              <h3 className="text-base font-bold text-white">Business Information</h3>
            </div>

            {/* Name */}
            <div>
              <label className="text-sm font-semibold text-gray-400 block mb-2">Business Name *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className={inputClass} required placeholder="e.g. Ram Kirana Pasal" />
            </div>

            {/* Business Type */}
            <div>
              <label className="text-sm font-semibold text-gray-400 block mb-2">Business Type</label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_TYPES.map(bt => (
                  <button
                    key={bt.value}
                    type="button"
                    onClick={() => handleTypeChange(bt)}
                    className={`py-3 px-3 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95 text-left flex items-center gap-2 ${
                      type === bt.value
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                        : 'border-white/10 text-gray-500'
                    }`}
                  >
                    <span className="text-lg">{bt.emoji}</span>
                    <span>{bt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Track Stock toggle */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${trackStock ? 'bg-blue-500/20' : 'bg-white/5'}`}>
                    <Package size={20} className={trackStock ? 'text-blue-400' : 'text-gray-600'} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">Track Stock</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {trackStock
                        ? 'Stock tab visible · Sell reduces inventory'
                        : 'Stock tab hidden · Sell records income only'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTrackStock(t => !t)}
                  className="shrink-0"
                >
                  {trackStock
                    ? <ToggleRight size={40} className="text-blue-400" />
                    : <ToggleLeft  size={40} className="text-gray-600" />
                  }
                </button>
              </div>
              {!trackStock && (
                <p className="text-xs text-amber-400 mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                  Perfect for restaurants, salons, services — no inventory needed
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-semibold text-gray-400 block mb-2">Phone Number</label>
              <input type="tel" placeholder="98XXXXXXXX" value={phone}
                onChange={e => setPhone(e.target.value)} className={inputClass} />
            </div>

            {/* Address */}
            <div>
              <label className="text-sm font-semibold text-gray-400 block mb-2">Address</label>
              <input placeholder="e.g. New Road, Kathmandu" value={address}
                onChange={e => setAddress(e.target.value)} className={inputClass} />
            </div>

            {/* PAN */}
            <div>
              <label className="text-sm font-semibold text-gray-400 block mb-2">PAN / VAT Number</label>
              <input placeholder="Optional — for IRD invoices" value={panNumber}
                onChange={e => setPanNumber(e.target.value)} className={inputClass} />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`w-full py-5 rounded-2xl font-bold text-xl active:scale-[0.98] transition-all disabled:opacity-60 ${
              saved ? 'bg-green-600 text-white' : 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
            }`}
          >
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl font-bold text-base active:scale-[0.98] transition-all"
        >
          <LogOut size={20} /> Logout
        </button>
      </div>
    </div>
  )
}
