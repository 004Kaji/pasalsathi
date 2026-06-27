'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BusinessType, Plan } from '@/types/database'

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: 'kirana', label: 'किराना / पसल' },
  { value: 'hardware', label: 'हार्डवेयर' },
  { value: 'pharmacy', label: 'फार्मेसी / औषधि' },
  { value: 'clothing', label: 'कपडा पसल' },
  { value: 'wholesale', label: 'थोक व्यापार' },
  { value: 'other', label: 'अन्य' },
]

const PLANS: { value: Plan; label: string; nepali: string; price: string; features: string[] }[] = [
  {
    value: 'sano',
    label: 'Sano',
    nepali: 'सानो',
    price: 'NPR ४९९/महिना',
    features: ['२ स्टाफ', '५० ग्राहक', '१०० सामान', '२० SMS'],
  },
  {
    value: 'madhyam',
    label: 'Madhyam',
    nepali: 'मध्यम',
    price: 'NPR १,१९९/महिना',
    features: ['१० स्टाफ', '३०० ग्राहक', '५०० सामान', '१०० SMS'],
  },
  {
    value: 'thulo',
    label: 'Thulo',
    nepali: 'ठूलो',
    price: 'NPR २,४९९/महिना',
    features: ['असीमित स्टाफ', 'असीमित ग्राहक', 'असीमित सामान', 'असीमित SMS'],
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState<BusinessType>('kirana')
  const [phone, setPhone] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<Plan>('sano')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      router.push('/login')
      return
    }

    const { error } = await supabase.from('businesses').insert({
      owner_id: user.id,
      name: businessName,
      type: businessType,
      phone: phone || null,
      plan: selectedPlan,
    })

    if (error) {
      setError('व्यापार बनाउन समस्या भयो। फेरि प्रयास गर्नुहोस्।')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-orange-600">पसलसाथी</h1>
          <p className="text-gray-500 mt-1">तपाईंको व्यापार सेटअप गर्नुहोस्</p>
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-2 w-12 rounded-full transition-colors ${s <= step ? 'bg-orange-600' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>व्यापारको जानकारी</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>व्यापारको नाम *</Label>
                <Input
                  placeholder="जस्तै: राम किराना पसल"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>व्यापारको प्रकार</Label>
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_TYPES.map((bt) => (
                    <button
                      key={bt.value}
                      type="button"
                      onClick={() => setBusinessType(bt.value)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        businessType === bt.value
                          ? 'border-orange-600 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>फोन नम्बर (वैकल्पिक)</Label>
                <Input
                  type="tel"
                  placeholder="98XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={!businessName.trim()}
                onClick={() => setStep(2)}
              >
                अर्को
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-center">प्लान छान्नुहोस्</h2>
            <p className="text-sm text-center text-gray-500">३० दिन नि:शुल्क — क्रेडिट कार्ड आवश्यक छैन</p>
            {PLANS.map((plan) => (
              <button
                key={plan.value}
                type="button"
                onClick={() => setSelectedPlan(plan.value)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                  selectedPlan === plan.value
                    ? 'border-orange-600 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-lg">{plan.nepali}</span>
                    <span className="text-gray-500 text-sm ml-2">({plan.label})</span>
                  </div>
                  <span className="font-semibold text-orange-600">{plan.price}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-gray-600">✓ {f}</li>
                  ))}
                </ul>
              </button>
            ))}
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                पछाडि
              </Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'बनाउँदैछ...' : 'सुरु गर्नुहोस्'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
