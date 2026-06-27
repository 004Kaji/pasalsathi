'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, CreditCard, Users, LogOut, ChevronRight } from 'lucide-react'
import type { Business, BusinessType } from '@/types/database'

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: 'kirana',    label: 'किराना / पसल' },
  { value: 'hardware',  label: 'हार्डवेयर' },
  { value: 'pharmacy',  label: 'फार्मेसी' },
  { value: 'clothing',  label: 'कपडा पसल' },
  { value: 'wholesale', label: 'थोक व्यापार' },
  { value: 'other',     label: 'अन्य' },
]

const PLAN_NP: Record<string, string> = {
  sano: 'सानो', madhyam: 'मध्यम', thulo: 'ठूलो',
}

export default function SettingsPage() {
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<BusinessType>('kirana')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [panNumber, setPanNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (biz) {
        const b = biz as Business
        setBusiness(b)
        setName(b.name)
        setType((b.type as BusinessType) ?? 'kirana')
        setPhone(b.phone ?? '')
        setAddress(b.address ?? '')
        setPanNumber(b.pan_number ?? '')
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
    await supabase.from('businesses').update({
      name: name.trim(),
      type,
      phone: phone.trim() || null,
      address: address.trim() || null,
      pan_number: panNumber.trim() || null,
    }).eq('id', business.id)

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

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-lg">लोड हुँदैछ...</div>

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="bg-gray-800 px-4 pt-5 pb-6">
        <h1 className="text-2xl font-bold text-white">सेटिङ</h1>
        <p className="text-gray-400 text-sm mt-1">व्यापार र खाताको जानकारी</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Quick links */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
          <Link href="/settings/billing" className="flex items-center justify-between px-5 py-4 active:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 rounded-xl p-2.5"><CreditCard size={20} className="text-orange-600" /></div>
              <div>
                <p className="text-base font-semibold text-gray-900">बिलिङ र प्लान</p>
                <p className="text-sm text-gray-400">हालको प्लान: {PLAN_NP[business?.plan ?? 'sano']}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </Link>
          <Link href="/settings/users" className="flex items-center justify-between px-5 py-4 active:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-xl p-2.5"><Users size={20} className="text-blue-600" /></div>
              <div>
                <p className="text-base font-semibold text-gray-900">टोली सदस्य</p>
                <p className="text-sm text-gray-400">स्टाफलाई पहुँच दिनुहोस्</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </Link>
        </div>

        {/* Business profile form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={20} className="text-gray-600" />
              <h3 className="text-base font-bold text-gray-800">व्यापारको जानकारी</h3>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold text-gray-700">व्यापारको नाम *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)}
                className="text-base h-12 rounded-xl" required />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold text-gray-700">व्यापारको प्रकार</Label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_TYPES.map((bt) => (
                  <button key={bt.value} type="button" onClick={() => setType(bt.value)}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all active:scale-95 text-left ${
                      type === bt.value ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-600'
                    }`}>
                    {bt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold text-gray-700">फोन नम्बर</Label>
              <Input type="tel" placeholder="98XXXXXXXX" value={phone}
                onChange={(e) => setPhone(e.target.value)} className="text-base h-12 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold text-gray-700">ठेगाना</Label>
              <Input placeholder="जस्तै: न्यूरोड, काठमाडौं" value={address}
                onChange={(e) => setAddress(e.target.value)} className="text-base h-12 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold text-gray-700">PAN नम्बर</Label>
              <Input placeholder="VAT/PAN नम्बर (वैकल्पिक)" value={panNumber}
                onChange={(e) => setPanNumber(e.target.value)} className="text-base h-12 rounded-xl" />
            </div>
          </div>

          <button type="submit" disabled={saving}
            className={`w-full py-5 rounded-2xl font-bold text-xl active:scale-[0.98] transition-all disabled:opacity-60 ${
              saved ? 'bg-green-600 text-white' : 'bg-gray-800 hover:bg-gray-900 text-white'
            }`}>
            {saved ? '✓ सुरक्षित भयो!' : saving ? 'सुरक्षित गर्दैछ...' : 'सुरक्षित गर्नुहोस्'}
          </button>
        </form>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl font-bold text-base active:scale-[0.98] transition-all"
        >
          <LogOut size={20} /> लगआउट गर्नुहोस्
        </button>
      </div>
    </div>
  )
}
