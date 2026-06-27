'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react'
import { getSubscriptionStatus } from '@/lib/subscription'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import type { Business, PaymentHistory, Plan } from '@/types/database'

const PLANS = [
  {
    value: 'sano' as Plan,
    nepali: 'सानो',
    monthly: 499,
    annual: 4990,
    color: 'border-green-400 bg-green-50',
    activeColor: 'border-green-600 bg-green-100',
    badge: 'bg-green-600',
    features: ['२ स्टाफ', '५० ग्राहक', '१०० सामान', '२० SMS/महिना', 'आधारभूत रिपोर्ट'],
  },
  {
    value: 'madhyam' as Plan,
    nepali: 'मध्यम',
    monthly: 1199,
    annual: 11990,
    color: 'border-blue-400 bg-blue-50',
    activeColor: 'border-blue-600 bg-blue-100',
    badge: 'bg-blue-600',
    features: ['१० स्टाफ', '३०० ग्राहक', '५०० सामान', '१०० SMS/महिना', 'PDF रिपोर्ट'],
  },
  {
    value: 'thulo' as Plan,
    nepali: 'ठूलो',
    monthly: 2499,
    annual: 24990,
    color: 'border-purple-400 bg-purple-50',
    activeColor: 'border-purple-600 bg-purple-100',
    badge: 'bg-purple-600',
    features: ['असीमित स्टाफ', 'असीमित ग्राहक', 'असीमित सामान', 'असीमित SMS', 'PDF + Excel + IRD'],
  },
]

export default function BillingPage() {
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [history, setHistory] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: biz }, { data: hist }] = await Promise.all([
        supabase.from('businesses').select('*').eq('owner_id', user.id).single(),
        supabase.from('payment_history').select('*')
          .eq('business_id', (await supabase.from('businesses').select('id').eq('owner_id', user.id).single()).data?.id)
          .order('created_at', { ascending: false }).limit(10),
      ])

      setBusiness(biz as Business)
      setHistory((hist as PaymentHistory[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-lg">लोड हुँदैछ...</div>
  if (!business) return null

  const subStatus = getSubscriptionStatus(business)
  const currentPlan = business.plan as Plan

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-orange-600 px-4 pt-5 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">बिलिङ र प्लान</h1>
        </div>

        {/* Current status */}
        <div className="bg-white/15 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            {subStatus.status === 'active' || subStatus.status === 'trial'
              ? <CheckCircle size={18} className="text-green-300" />
              : <Clock size={18} className="text-yellow-300" />
            }
            <p className="text-white font-bold text-base">
              {subStatus.status === 'trial' ? `नि:शुल्क परीक्षण — ${subStatus.daysLeft} दिन बाँकी` :
               subStatus.status === 'active' ? 'सक्रिय सदस्यता' :
               subStatus.status === 'grace' ? `Grace Period — ${subStatus.daysLeft} दिन बाँकी` :
               'सदस्यता समाप्त'}
            </p>
          </div>
          <p className="text-orange-100 text-sm">
            हालको प्लान: <strong className="text-white">
              {PLANS.find((p) => p.value === currentPlan)?.nepali}
            </strong>
          </p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Billing toggle */}
        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`flex-1 py-3 rounded-xl font-bold text-base transition-all ${billing === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            मासिक
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={`flex-1 py-3 rounded-xl font-bold text-base transition-all ${billing === 'annual' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            वार्षिक
            <span className="ml-1.5 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">२ महिना मुफ्त</span>
          </button>
        </div>

        {/* Plan cards */}
        <div className="space-y-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.value === currentPlan
            const price = billing === 'monthly' ? plan.monthly : plan.annual
            const perMonth = billing === 'annual' ? Math.round(plan.annual / 12) : plan.monthly

            return (
              <div
                key={plan.value}
                className={`rounded-2xl border-2 p-5 transition-all ${isCurrent ? plan.activeColor : plan.color}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`${plan.badge} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
                      {plan.nepali}
                    </span>
                    {isCurrent && (
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        ✓ हालको प्लान
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      NPR {price.toLocaleString('ne-NP')}
                    </p>
                    {billing === 'annual' && (
                      <p className="text-xs text-gray-500">NPR {perMonth}/महिना</p>
                    )}
                  </div>
                </div>

                <ul className="space-y-1.5 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle size={14} className="text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {!isCurrent ? (
                  <div className="space-y-2">
                    <p className="text-xs text-center text-gray-500 font-medium">eSewa वा Khalti बाट भुक्तान गर्नुहोस्</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => alert('eSewa integration — छिट्टै आउँदैछ!')}
                        className="py-3 bg-green-600 text-white rounded-xl font-bold text-sm active:scale-[0.98]"
                      >
                        🟢 eSewa
                      </button>
                      <button
                        onClick={() => alert('Khalti integration — छिट्टै आउँदैछ!')}
                        className="py-3 bg-purple-600 text-white rounded-xl font-bold text-sm active:scale-[0.98]"
                      >
                        🟣 Khalti
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/60 rounded-xl py-3 text-center">
                    <p className="text-sm font-semibold text-gray-600">✓ तपाईं यो प्लानमा हुनुहुन्छ</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Payment history */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-3">भुक्तान इतिहास</h3>
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {PLANS.find((p) => p.value === h.plan)?.nepali} — {h.billing_cycle === 'monthly' ? 'मासिक' : 'वार्षिक'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {h.paid_at ? new Date(h.paid_at).toLocaleDateString('ne-NP', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">NPR {Number(h.amount).toLocaleString('ne-NP')}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      h.status === 'success' ? 'bg-green-100 text-green-700' :
                      h.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {h.status === 'success' ? '✓ भुक्तान भयो' : h.status === 'pending' ? 'बाँकी' : 'असफल'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
