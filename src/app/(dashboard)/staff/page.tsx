'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, UserCheck, ChevronRight, CalendarCheck } from 'lucide-react'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import type { Staff, Attendance, AttendanceStatus, Plan } from '@/types/database'

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; bg: string; text: string; emoji: string }> = {
  present:  { label: 'उपस्थित',   bg: 'bg-green-100',  text: 'text-green-700',  emoji: '✅' },
  absent:   { label: 'अनुपस्थित', bg: 'bg-red-100',    text: 'text-red-700',    emoji: '❌' },
  half_day: { label: 'आधा दिन',   bg: 'bg-amber-100',  text: 'text-amber-700',  emoji: '🌗' },
  holiday:  { label: 'बिदा',      bg: 'bg-blue-100',   text: 'text-blue-700',   emoji: '🏖️' },
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [todayAttendance, setTodayAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<Plan>('sano')

  const today = new Date().toISOString().split('T')[0]

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: biz } = await supabase
      .from('businesses')
      .select('id, plan')
      .eq('owner_id', user.id)
      .single()
    if (!biz) return
    setPlan(biz.plan as Plan)

    const [{ data: staff }, { data: att }] = await Promise.all([
      supabase
        .from('staff')
        .select('*')
        .eq('business_id', biz.id)
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('attendance')
        .select('staff_id, status')
        .eq('business_id', biz.id)
        .eq('attendance_date', today),
    ])

    setStaffList((staff as Staff[]) ?? [])

    const attMap: Record<string, AttendanceStatus> = {}
    ;(att as Attendance[])?.forEach((a) => { attMap[a.staff_id] = a.status })
    setTodayAttendance(attMap)
    setLoading(false)
  }, [today])

  useEffect(() => { fetchData() }, [fetchData])

  const presentCount = Object.values(todayAttendance).filter(
    (s) => s === 'present' || s === 'half_day'
  ).length
  const markedCount = Object.keys(todayAttendance).length
  const limit = PLAN_LIMITS[plan].staff
  const atLimit = limit !== Infinity && staffList.length >= limit

  const todayDisplay = new Date().toLocaleDateString('ne-NP', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 z-10 px-4 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">👥 स्टाफ</h1>
          <div className="flex gap-2">
            {staffList.length > 0 && (
              <Link
                href="/staff/attendance"
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
              >
                <CalendarCheck size={18} /> हाजिरी
              </Link>
            )}
            {!atLimit && (
              <Link
                href="/staff/new"
                className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
              >
                <Plus size={18} /> थप्नुहोस्
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Today's summary */}
        <div className="bg-gradient-to-br from-purple-600/30 to-purple-900/20 border border-purple-500/20 rounded-2xl p-5">
          <p className="text-purple-300 text-sm">📅 {todayDisplay}</p>
          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="text-purple-300 text-sm font-medium">आज उपस्थित</p>
              <p className="text-white text-4xl font-bold mt-0.5">
                {presentCount}
                <span className="text-2xl text-purple-400">/{staffList.length}</span>
              </p>
            </div>
            <div className="text-right">
              <UserCheck size={40} className="text-purple-400" />
              {markedCount < staffList.length && staffList.length > 0 && (
                <p className="text-yellow-400 text-xs font-semibold mt-1">
                  {staffList.length - markedCount} जनाको हाजिरी बाँकी
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Plan usage */}
        {limit !== Infinity && (
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <span className="text-sm text-gray-400">स्टाफ: <strong className="text-white">{staffList.length}</strong> / {limit}</span>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${staffList.length / limit > 0.8 ? 'bg-red-500' : 'bg-purple-500'}`}
                style={{ width: `${Math.min(100, (staffList.length / limit) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Mark attendance CTA */}
        {staffList.length > 0 && markedCount < staffList.length && (
          <Link href="/staff/attendance">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform">
              <div>
                <p className="font-bold text-yellow-400 text-base">⏰ आजको हाजिरी भर्नुहोस्</p>
                <p className="text-yellow-500 text-sm mt-0.5">
                  {staffList.length - markedCount} जनाको हाजिरी अझै भरिएको छैन
                </p>
              </div>
              <ChevronRight size={22} className="text-yellow-500" />
            </div>
          </Link>
        )}

        {/* Staff list */}
        {loading ? (
          <div className="text-center py-12 text-gray-500 text-lg">लोड हुँदैछ...</div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">👤</p>
            <p className="text-xl font-semibold text-gray-500">कुनै स्टाफ छैन</p>
            <p className="text-base text-gray-600 mt-2">माथिको "+ थप्नुहोस्" थिच्नुहोस्</p>
          </div>
        ) : (
          <div className="space-y-3">
            {staffList.map((s) => {
              const status = todayAttendance[s.id]
              const cfg = status ? STATUS_CONFIG[status] : null
              return (
                <Link key={s.id} href={`/staff/${s.id}`}>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="bg-purple-500/20 rounded-full w-12 h-12 flex items-center justify-center shrink-0">
                        <span className="text-purple-300 font-bold text-lg">
                          {s.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-white truncate">{s.name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {s.role || 'स्टाफ'} · 💵 NPR {Number(s.monthly_salary).toLocaleString('ne-NP')}/महिना
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      {cfg ? (
                        <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${cfg.bg} ${cfg.text}`}>
                          {cfg.emoji} {cfg.label}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 bg-white/10 px-3 py-1.5 rounded-full">
                          भरिएको छैन
                        </span>
                      )}
                      <ChevronRight size={18} className="text-gray-600" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
