'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save } from 'lucide-react'
import type { Staff, AttendanceStatus } from '@/types/database'

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; emoji: string; bg: string; activeBg: string; activeText: string }[] = [
  { value: 'present',  label: 'उपस्थित',   emoji: '✅', bg: 'bg-gray-50 border-gray-200 text-gray-600',       activeBg: 'bg-green-500',  activeText: 'text-white' },
  { value: 'absent',   label: 'अनुपस्थित', emoji: '❌', bg: 'bg-gray-50 border-gray-200 text-gray-600',       activeBg: 'bg-red-500',    activeText: 'text-white' },
  { value: 'half_day', label: 'आधा दिन',   emoji: '🌗', bg: 'bg-gray-50 border-gray-200 text-gray-600',       activeBg: 'bg-amber-500',  activeText: 'text-white' },
  { value: 'holiday',  label: 'बिदा',      emoji: '🏖️', bg: 'bg-gray-50 border-gray-200 text-gray-600',       activeBg: 'bg-blue-500',   activeText: 'text-white' },
]

export default function AttendancePage() {
  const router = useRouter()
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [businessId, setBusinessId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const todayDisplay = new Date().toLocaleDateString('ne-NP', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: biz } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()
    if (!biz) return
    setBusinessId(biz.id)

    const [{ data: staff }, { data: att }] = await Promise.all([
      supabase.from('staff').select('*').eq('business_id', biz.id).eq('is_active', true).order('name'),
      supabase.from('attendance').select('staff_id, status').eq('business_id', biz.id).eq('attendance_date', today),
    ])

    setStaffList((staff as Staff[]) ?? [])

    const attMap: Record<string, AttendanceStatus> = {}
    ;(att as { staff_id: string; status: AttendanceStatus }[])?.forEach((a) => {
      attMap[a.staff_id] = a.status
    })
    setAttendance(attMap)
    setLoading(false)
  }, [today])

  useEffect(() => { fetchData() }, [fetchData])

  function markAll(status: AttendanceStatus) {
    const all: Record<string, AttendanceStatus> = {}
    staffList.forEach((s) => { all[s.id] = status })
    setAttendance(all)
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()

    for (const staffId of Object.keys(attendance)) {
      await supabase
        .from('attendance')
        .upsert(
          { business_id: businessId, staff_id: staffId, attendance_date: today, status: attendance[staffId] },
          { onConflict: 'staff_id,attendance_date' }
        )
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); router.push('/staff') }, 1200)
  }

  const markedCount = Object.keys(attendance).length

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-lg">लोड हुँदैछ...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-purple-600 px-4 pt-5 pb-5">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">हाजिरी</h1>
        </div>
        <p className="text-purple-100 text-base font-medium">{todayDisplay}</p>
        <p className="text-purple-200 text-sm mt-0.5">
          {markedCount}/{staffList.length} जनाको हाजिरी भरियो
        </p>
      </div>

      <div className="px-4 pt-4 space-y-4 pb-32">
        {/* Mark all buttons */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-600 mb-3">सबैलाई एकैचोटि चिन्ह लगाउनुहोस्:</p>
          <div className="grid grid-cols-4 gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => markAll(opt.value)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-semibold transition-all active:scale-95 ${opt.bg}`}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="truncate w-full text-center px-1">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Individual staff */}
        {staffList.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">👤</p>
            <p className="text-xl text-gray-500">कुनै स्टाफ छैन</p>
          </div>
        ) : (
          <div className="space-y-3">
            {staffList.map((s) => {
              const current = attendance[s.id]
              return (
                <div key={s.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {/* Staff name row */}
                  <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3">
                    <div className="bg-purple-100 rounded-full w-10 h-10 flex items-center justify-center shrink-0">
                      <span className="text-purple-700 font-bold">{s.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.role || 'स्टाफ'}</p>
                    </div>
                  </div>

                  {/* Status buttons */}
                  <div className="grid grid-cols-4 gap-0 divide-x divide-gray-100">
                    {STATUS_OPTIONS.map((opt) => {
                      const isActive = current === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAttendance((prev) => ({ ...prev, [s.id]: opt.value }))}
                          className={`flex flex-col items-center gap-1 py-3 transition-all active:scale-95 ${
                            isActive ? `${opt.activeBg} ${opt.activeText}` : 'bg-white text-gray-500'
                          }`}
                        >
                          <span className="text-xl">{opt.emoji}</span>
                          <span className="text-xs font-medium">{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating save button */}
      {staffList.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4">
          <button
            onClick={handleSave}
            disabled={saving || markedCount === 0 || saved}
            className={`w-full py-5 rounded-2xl font-bold text-xl text-white flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg ${
              saved ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {saved ? (
              '✓ सुरक्षित भयो!'
            ) : (
              <>
                <Save size={22} />
                {saving ? 'सुरक्षित गर्दैछ...' : `हाजिरी सुरक्षित गर्नुहोस् (${markedCount}/${staffList.length})`}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
