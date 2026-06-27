'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Users, Info } from 'lucide-react'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import type { Plan } from '@/types/database'

const PLAN_NP: Record<string, string> = { sano: 'सानो', madhyam: 'मध्यम', thulo: 'ठूलो' }
const ROLE_NP: Record<string, string> = { owner: 'मालिक', manager: 'म्यानेजर', staff: 'स्टाफ' }

export default function UsersPage() {
  const router = useRouter()
  const [plan, setPlan] = useState<Plan>('sano')
  const [users, setUsers] = useState<{ id: string; role: string; email?: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: biz } = await supabase.from('businesses').select('id, plan').eq('owner_id', user.id).single()
      if (!biz) return
      setPlan(biz.plan as Plan)

      const { data: bizUsers } = await supabase
        .from('business_users')
        .select('id, role, user_id')
        .eq('business_id', biz.id)

      // Include owner
      setUsers([
        { id: user.id, role: 'owner', email: user.email },
        ...((bizUsers ?? []).map((u) => ({ id: u.user_id, role: u.role }))),
      ])
      setLoading(false)
    }
    load()
  }, [])

  const limit = PLAN_LIMITS[plan].users
  const atLimit = limit !== Infinity && users.length >= limit

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-lg">लोड हुँदैछ...</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-blue-600 px-4 pt-5 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">टोली सदस्य</h1>
        </div>
        <p className="text-blue-100 text-sm mt-3">
          प्लान अनुसार {limit === Infinity ? 'असीमित' : limit} जना सदस्य थप्न सकिन्छ
        </p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Info card */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
          <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">टोली सदस्य कसरी थप्ने?</p>
            <p className="text-sm text-blue-600 mt-1">
              यो सुविधा छिट्टै आउँदैछ। अहिले तपाईंले आफ्नो खाताको जानकारी (इमेल/फोन) स्टाफसँग सेयर गरेर प्रयोग गर्न सक्नुहुन्छ।
            </p>
          </div>
        </div>

        {/* Users list */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-4 px-5 py-4">
              <div className="bg-blue-100 rounded-full w-11 h-11 flex items-center justify-center shrink-0">
                <Users size={20} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-900 truncate">
                  {u.email ?? u.id.slice(0, 8) + '...'}
                </p>
                <p className="text-sm text-gray-400">{ROLE_NP[u.role] ?? u.role}</p>
              </div>
              {u.role === 'owner' && (
                <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2.5 py-1 rounded-full">मालिक</span>
              )}
            </div>
          ))}
        </div>

        {/* Upgrade if needed */}
        {atLimit && (
          <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 text-center">
            <p className="font-bold text-orange-800">सदस्य सीमा पुग्यो ({limit})</p>
            <p className="text-sm text-orange-600 mt-1">अधिक सदस्यको लागि {PLAN_NP[plan]} भन्दा माथिको प्लान लिनुहोस्</p>
            <a href="/settings/billing" className="mt-3 block bg-orange-600 text-white py-3 rounded-xl font-bold text-sm active:scale-[0.98]">
              अपग्रेड गर्नुहोस् →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
