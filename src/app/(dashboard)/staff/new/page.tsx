'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import type { Plan } from '@/types/database'

const ROLES = ['क्यासियर', 'सेल्समान', 'गोदाम स्टाफ', 'डेलिभरी', 'सफाइ', 'म्यानेजर', 'अन्य']

export default function NewStaffPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [phone, setPhone] = useState('')
  const [salary, setSalary] = useState('')
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('नाम आवश्यक छ'); return }
    if (!salary || Number(salary) <= 0) { setError('तलब राख्नुहोस्'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: biz } = await supabase
      .from('businesses')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single()
    if (!biz) { router.push('/onboarding'); return }

    // Plan limit check
    const { count } = await supabase
      .from('staff')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', biz.id)
      .eq('is_active', true)

    const limit = PLAN_LIMITS[biz.plan as Plan].staff
    if (limit !== Infinity && (count ?? 0) >= limit) {
      setError(`तपाईंको प्लानमा अधिकतम ${limit} स्टाफ राख्न सकिन्छ। अपग्रेड गर्नुहोस्।`)
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('staff').insert({
      business_id: biz.id,
      name: name.trim(),
      role: role.trim() || null,
      phone: phone.trim() || null,
      monthly_salary: parseFloat(salary),
      join_date: joinDate,
    })

    if (insertError) {
      setError('स्टाफ थप्न समस्या भयो। फेरि प्रयास गर्नुहोस्।')
      setLoading(false)
      return
    }

    router.push('/staff')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-purple-600 px-4 pt-5 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">नयाँ स्टाफ थप्नुहोस्</h1>
        </div>
        <p className="text-purple-100 text-sm mt-3">कर्मचारीको जानकारी राख्नुहोस्</p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-5 space-y-4 pb-10">

        {/* Name */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-2">
          <Label className="text-base font-semibold text-gray-700">
            पूरा नाम <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="जस्तै: सुनिता श्रेष्ठ"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-base h-12 rounded-xl"
            required
          />
        </div>

        {/* Role */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <Label className="text-base font-semibold text-gray-700">पद (Role)</Label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2.5 px-2 rounded-xl border-2 text-sm font-medium transition-all active:scale-95 ${
                  role === r
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-100 text-gray-600'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <Input
            placeholder="वा आफ्नै पद लेख्नुहोस्..."
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="text-base h-12 rounded-xl"
          />
        </div>

        {/* Phone & Salary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold text-gray-700">फोन नम्बर</Label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 bg-gray-100 border rounded-xl text-sm text-gray-600 whitespace-nowrap">+977</span>
              <Input
                type="tel"
                placeholder="98XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-base h-12 rounded-xl"
                maxLength={10}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold text-gray-700">
              मासिक तलब (NPR) <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-12">
              <span className="px-3 bg-gray-50 text-gray-500 font-semibold border-r border-gray-200 h-full flex items-center">रु.</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="flex-1 px-3 text-xl font-bold text-gray-900 outline-none bg-transparent"
                min="0"
                required
              />
            </div>
            <div className="flex gap-2">
              {[8000, 12000, 15000, 20000].map((s) => (
                <button key={s} type="button" onClick={() => setSalary(String(s))}
                  className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium text-sm active:scale-95">
                  {(s / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Join date */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-2">
          <Label className="text-base font-semibold text-gray-700">सुरु मिति</Label>
          <input
            type="date"
            value={joinDate}
            onChange={(e) => setJoinDate(e.target.value)}
            className="w-full text-base border border-gray-200 rounded-xl px-4 h-12 outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-base">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim() || !salary}
          className="w-full py-5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xl active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? 'थप्दैछ...' : '✓ स्टाफ थप्नुहोस्'}
        </button>
      </form>
    </div>
  )
}
