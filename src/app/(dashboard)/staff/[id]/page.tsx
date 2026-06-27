'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Phone, Calendar, Banknote, CheckCircle } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Staff, Attendance, SalaryPayment, AttendanceStatus } from '@/types/database'

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present:  'bg-green-500',
  absent:   'bg-red-500',
  half_day: 'bg-amber-400',
  holiday:  'bg-blue-400',
}
const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'उ', absent: 'अ', half_day: '½', holiday: 'बि',
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export default function StaffDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [staff, setStaff] = useState<Staff | null>(null)
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const [viewYear] = useState(now.getFullYear())
  const [viewMonth] = useState(now.getMonth() + 1)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const monthStart = `${viewYear}-${String(viewMonth).padStart(2, '0')}-01`
    const monthEnd = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${daysInMonth(viewYear, viewMonth)}`

    const [{ data: s }, { data: att }, { data: sal }] = await Promise.all([
      supabase.from('staff').select('*').eq('id', id).single(),
      supabase.from('attendance').select('*').eq('staff_id', id)
        .gte('attendance_date', monthStart).lte('attendance_date', monthEnd)
        .order('attendance_date'),
      supabase.from('salary_payments').select('*').eq('staff_id', id).order('year', { ascending: false }).order('month', { ascending: false }).limit(6),
    ])

    setStaff(s as Staff)
    setAttendance((att as Attendance[]) ?? [])
    setSalaryPayments((sal as SalaryPayment[]) ?? [])
    setLoading(false)
  }, [id, viewYear, viewMonth])

  useEffect(() => { fetchData() }, [fetchData])

  // Salary calculation
  const totalDays = daysInMonth(viewYear, viewMonth)
  const attMap = Object.fromEntries(attendance.map((a) => [a.attendance_date, a.status]))
  const presentDays = attendance.filter((a) => a.status === 'present').length
  const halfDays = attendance.filter((a) => a.status === 'half_day').length
  const effectiveDays = presentDays + halfDays * 0.5
  const payableAmount = staff ? Math.round((Number(staff.monthly_salary) / totalDays) * effectiveDays) : 0

  const thisMonthPaid = salaryPayments.find(
    (p) => p.month === viewMonth && p.year === viewYear && p.status === 'paid'
  )

  async function markSalaryPaid() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: biz } = await supabase.from('businesses').select('id').eq('owner_id', user.id).single()
    if (!biz) return

    await supabase.from('salary_payments').upsert({
      business_id: biz.id,
      staff_id: id,
      month: viewMonth,
      year: viewYear,
      working_days: totalDays,
      present_days: presentDays,
      payable_amount: payableAmount,
      paid_amount: payableAmount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      status: 'paid',
    }, { onConflict: 'staff_id,month,year' })

    await fetchData()
  }

  async function handleDeactivate() {
    const supabase = createClient()
    await supabase.from('staff').update({ is_active: false }).eq('id', id)
    router.push('/staff')
  }

  const monthName = new Date(viewYear, viewMonth - 1).toLocaleDateString('ne-NP', { month: 'long', year: 'numeric' })

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-lg">लोड हुँदैछ...</div>
  if (!staff) return <div className="flex items-center justify-center min-h-screen text-red-500 text-lg">स्टाफ भेटिएन</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-purple-600 px-4 pt-5 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform">
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-xl font-bold text-white">{staff.name}</h1>
          </div>
          <AlertDialog>
            <AlertDialogTrigger className="px-3 py-2 rounded-xl bg-white/20 text-white text-sm font-semibold active:scale-95">
              हटाउनुहोस्
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl">स्टाफ हटाउने?</AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  "{staff.name}" स्टाफ सूचीबाट हटाइनेछ।
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-base">रद्द</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeactivate} className="bg-red-600 hover:bg-red-700 text-base">हटाउनुहोस्</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Info row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-white/70 text-xs">पद</p>
            <p className="text-white font-bold text-sm mt-0.5">{staff.role || 'स्टाफ'}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-white/70 text-xs">मासिक तलब</p>
            <p className="text-white font-bold text-sm mt-0.5">NPR {Number(staff.monthly_salary).toLocaleString('ne-NP')}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-white/70 text-xs">सुरु मिति</p>
            <p className="text-white font-bold text-sm mt-0.5">
              {staff.join_date ? new Date(staff.join_date).toLocaleDateString('ne-NP', { month: 'short', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>
        {staff.phone && (
          <div className="mt-3 flex items-center gap-2 text-purple-100 text-sm">
            <Phone size={14} /> {staff.phone}
          </div>
        )}
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Monthly salary card */}
        <div className={`rounded-2xl p-5 border-2 ${thisMonthPaid ? 'bg-green-50 border-green-300' : 'bg-white border-purple-200'} shadow-sm`}>
          <div className="flex items-center gap-2 mb-3">
            <Banknote size={20} className={thisMonthPaid ? 'text-green-600' : 'text-purple-600'} />
            <h3 className={`text-base font-bold ${thisMonthPaid ? 'text-green-700' : 'text-purple-700'}`}>
              {monthName} — तलब हिसाब
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">उपस्थित दिन</p>
              <p className="text-xl font-bold text-gray-900">{presentDays}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">आधा दिन</p>
              <p className="text-xl font-bold text-amber-700">{halfDays}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">कुल दिन</p>
              <p className="text-xl font-bold text-blue-700">{totalDays}</p>
            </div>
          </div>

          <div className={`rounded-xl p-4 ${thisMonthPaid ? 'bg-green-100' : 'bg-purple-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  NPR {Number(staff.monthly_salary).toLocaleString()} ÷ {totalDays} दिन × {effectiveDays} दिन
                </p>
                <p className={`text-3xl font-bold mt-1 ${thisMonthPaid ? 'text-green-800' : 'text-purple-900'}`}>
                  NPR {payableAmount.toLocaleString('ne-NP')}
                </p>
              </div>
              {thisMonthPaid && (
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle size={32} className="text-green-600" />
                  <span className="text-xs font-semibold text-green-700">तिरियो</span>
                </div>
              )}
            </div>
          </div>

          {!thisMonthPaid && attendance.length > 0 && (
            <button
              onClick={markSalaryPaid}
              className="w-full mt-3 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-base rounded-xl active:scale-[0.98] transition-all"
            >
              ✓ तलब तिरियो (नगद)
            </button>
          )}
          {attendance.length === 0 && (
            <p className="text-center text-sm text-gray-400 mt-3">यो महिनाको हाजिरी अझै भरिएको छैन</p>
          )}
        </div>

        {/* Monthly attendance calendar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-purple-600" />
            <h3 className="text-base font-bold text-gray-800">{monthName} — हाजिरी</h3>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs font-semibold">
            {[
              { color: 'bg-green-500', label: 'उ = उपस्थित' },
              { color: 'bg-red-500',   label: 'अ = अनुपस्थित' },
              { color: 'bg-amber-400', label: '½ = आधा दिन' },
              { color: 'bg-blue-400',  label: 'बि = बिदा' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-gray-600">
                <span className={`w-3 h-3 rounded-sm ${color} inline-block`} />
                {label}
              </span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: totalDays }, (_, i) => {
              const day = i + 1
              const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const status = attMap[dateStr] as AttendanceStatus | undefined
              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold ${
                    status ? `${STATUS_COLORS[status]} text-white` : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <span className="text-[10px] leading-none opacity-75">{day}</span>
                  {status && <span className="text-[11px] leading-none mt-0.5">{STATUS_LABELS[status]}</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Salary history */}
        {salaryPayments.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-3">तलब इतिहास</h3>
            <div className="space-y-2">
              {salaryPayments.map((p) => {
                const mLabel = new Date(p.year, p.month - 1).toLocaleDateString('ne-NP', { month: 'long', year: 'numeric' })
                return (
                  <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl ${p.status === 'paid' ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{mLabel}</p>
                      <p className="text-xs text-gray-400">
                        {p.present_days}/{p.working_days} दिन
                        {p.payment_date ? ` · ${new Date(p.payment_date).toLocaleDateString('ne-NP', { month: 'short', day: 'numeric' })} मा तिरियो` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-base ${p.status === 'paid' ? 'text-green-700' : 'text-gray-700'}`}>
                        NPR {Number(p.payable_amount).toLocaleString('ne-NP')}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {p.status === 'paid' ? '✓ तिरियो' : 'बाँकी'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
