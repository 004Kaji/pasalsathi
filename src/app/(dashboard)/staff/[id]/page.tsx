'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Phone, Calendar, Banknote, CheckCircle, Tag } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Staff, Attendance, SalaryPayment, AttendanceStatus, PaymentMethod } from '@/types/database'
import { formatBSFull } from '@/lib/bs-date'

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present:  'bg-green-500',
  absent:   'bg-red-500',
  half_day: 'bg-amber-400',
  holiday:  'bg-blue-400',
}
const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'P', absent: 'A', half_day: '½', holiday: 'H',
}

const PAYMENT_OPTS: { value: PaymentMethod; label: string; emoji: string }[] = [
  { value: 'cash',    label: 'Cash',    emoji: '💵' },
  { value: 'bank',    label: 'Bank',    emoji: '🏦' },
  { value: 'esewa',   label: 'eSewa',   emoji: '🟢' },
  { value: 'khalti',  label: 'Khalti',  emoji: '🟣' },
  { value: 'fonepay', label: 'FonePay', emoji: '📱' },
]

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
  const [discountLimit, setDiscountLimit] = useState('')
  const [savingDiscount, setSavingDiscount] = useState(false)
  const [discountSaved, setDiscountSaved] = useState(false)
  const [salaryPayMethod, setSalaryPayMethod] = useState<PaymentMethod>('cash')
  const [markingPaid, setMarkingPaid] = useState(false)

  const now = new Date()
  const [viewYear] = useState(now.getFullYear())
  const [viewMonth] = useState(now.getMonth() + 1)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const monthStart = `${viewYear}-${String(viewMonth).padStart(2, '0')}-01`
    const monthEnd   = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${daysInMonth(viewYear, viewMonth)}`

    const [{ data: s }, { data: att }, { data: sal }] = await Promise.all([
      supabase.from('staff').select('*').eq('id', id).single(),
      supabase.from('attendance').select('*').eq('staff_id', id)
        .gte('attendance_date', monthStart).lte('attendance_date', monthEnd)
        .order('attendance_date'),
      supabase.from('salary_payments').select('*').eq('staff_id', id)
        .order('year', { ascending: false }).order('month', { ascending: false }).limit(6),
    ])

    setStaff(s as Staff)
    setDiscountLimit(String(Number((s as Staff)?.max_discount_percent ?? 0)))
    setAttendance((att as Attendance[]) ?? [])
    setSalaryPayments((sal as SalaryPayment[]) ?? [])
    setLoading(false)
  }, [id, viewYear, viewMonth])

  useEffect(() => { fetchData() }, [fetchData])

  const totalDays    = daysInMonth(viewYear, viewMonth)
  const attMap       = Object.fromEntries(attendance.map(a => [a.attendance_date, a.status]))
  const presentDays  = attendance.filter(a => a.status === 'present').length
  const halfDays     = attendance.filter(a => a.status === 'half_day').length
  const effectiveDays = presentDays + halfDays * 0.5
  const payableAmount = staff ? Math.round((Number(staff.monthly_salary) / totalDays) * effectiveDays) : 0

  const thisMonthPaid = salaryPayments.find(
    p => p.month === viewMonth && p.year === viewYear && p.status === 'paid'
  )

  const monthLabel = new Date(viewYear, viewMonth - 1).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  })

  async function markSalaryPaid() {
    setMarkingPaid(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMarkingPaid(false); return }
    const { data: biz } = await supabase.from('businesses').select('id').eq('owner_id', user.id).single()
    if (!biz) { setMarkingPaid(false); return }

    const today = new Date().toISOString().split('T')[0]

    await supabase.from('salary_payments').upsert({
      business_id:    biz.id,
      staff_id:       id,
      month:          viewMonth,
      year:           viewYear,
      working_days:   totalDays,
      present_days:   presentDays,
      payable_amount: payableAmount,
      paid_amount:    payableAmount,
      payment_date:   today,
      payment_method: salaryPayMethod,
      status:         'paid',
    }, { onConflict: 'staff_id,month,year' })

    await supabase.from('transactions').insert({
      business_id:      biz.id,
      type:             'out',
      amount:           payableAmount,
      discount_percent: 0,
      category:         'salary',
      description:      `Salary — ${staff?.name ?? ''} — ${monthLabel}`,
      payment_method:   salaryPayMethod,
      transaction_date: today,
      created_by:       user.id,
    })

    await fetchData()
    setMarkingPaid(false)
  }

  async function handleDeactivate() {
    const supabase = createClient()
    await supabase.from('staff').update({ is_active: false }).eq('id', id)
    router.push('/staff')
  }

  async function saveDiscountLimit() {
    const pct = parseFloat(discountLimit)
    if (isNaN(pct) || pct < 0 || pct > 100) return
    setSavingDiscount(true)
    const supabase = createClient()
    await supabase.from('staff').update({ max_discount_percent: pct }).eq('id', id)
    setSavingDiscount(false)
    setDiscountSaved(true)
    setTimeout(() => setDiscountSaved(false), 2000)
    await fetchData()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-gray-400 text-lg">
      Loading...
    </div>
  )
  if (!staff) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-red-400 text-lg">
      Staff not found
    </div>
  )

  const discPct = Number(staff.max_discount_percent ?? 0)

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-900 px-4 pt-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform">
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{staff.name}</h1>
              {staff.phone && (
                <div className="flex items-center gap-1 text-purple-200 text-sm mt-0.5">
                  <Phone size={13} /> {staff.phone}
                </div>
              )}
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger className="px-3 py-2 rounded-xl bg-white/20 text-white text-sm font-semibold active:scale-95">
              Deactivate
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate staff?</AlertDialogTitle>
                <AlertDialogDescription>"{staff.name}" will be removed from the active staff list.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeactivate} className="bg-red-600 hover:bg-red-700">Deactivate</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-white/70 text-xs">Role</p>
            <p className="text-white font-bold text-sm mt-0.5">{staff.role || 'Staff'}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-white/70 text-xs">Monthly Salary</p>
            <p className="text-white font-bold text-sm mt-0.5">NPR {Number(staff.monthly_salary).toLocaleString('ne-NP')}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <p className="text-white/70 text-xs">Joined</p>
            <p className="text-white font-bold text-sm mt-0.5">
              {staff.join_date ? formatBSFull(new Date(staff.join_date + 'T00:00:00')) : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">

        {/* ── Salary card ── */}
        <div className={`rounded-2xl p-5 border-2 ${
          thisMonthPaid ? 'bg-green-500/10 border-green-500/30' : 'bg-purple-500/10 border-purple-500/30'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Banknote size={20} className={thisMonthPaid ? 'text-green-400' : 'text-purple-400'} />
            <h3 className={`text-base font-bold ${thisMonthPaid ? 'text-green-400' : 'text-purple-400'}`}>
              {monthLabel} — Salary
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Present</p>
              <p className="text-xl font-bold text-white">{presentDays}</p>
            </div>
            <div className="bg-amber-500/10 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Half Day</p>
              <p className="text-xl font-bold text-amber-400">{halfDays}</p>
            </div>
            <div className="bg-blue-500/10 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Total Days</p>
              <p className="text-xl font-bold text-blue-400">{totalDays}</p>
            </div>
          </div>

          <div className={`rounded-xl p-4 mb-3 ${thisMonthPaid ? 'bg-green-500/10' : 'bg-purple-500/10'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">
                  NPR {Number(staff.monthly_salary).toLocaleString()} ÷ {totalDays} × {effectiveDays} days
                </p>
                <p className={`text-3xl font-bold mt-1 ${thisMonthPaid ? 'text-green-300' : 'text-purple-200'}`}>
                  NPR {payableAmount.toLocaleString('ne-NP')}
                </p>
              </div>
              {thisMonthPaid && (
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle size={32} className="text-green-400" />
                  <span className="text-xs font-semibold text-green-400">Paid</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment method picker */}
          {!thisMonthPaid && attendance.length > 0 && (
            <>
              <p className="text-xs text-gray-500 mb-2">Pay via</p>
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {PAYMENT_OPTS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSalaryPayMethod(opt.value)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-xl border-2 text-xs font-semibold transition-all active:scale-95 ${
                      salaryPayMethod === opt.value
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                        : 'border-white/10 text-gray-600'
                    }`}
                  >
                    <span className="text-base">{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={markSalaryPaid}
                disabled={markingPaid}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold text-base rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {markingPaid ? 'Saving...' : `✓ Mark Salary Paid — NPR ${payableAmount.toLocaleString('ne-NP')} via ${PAYMENT_OPTS.find(o => o.value === salaryPayMethod)?.label}`}
              </button>
            </>
          )}
          {attendance.length === 0 && !thisMonthPaid && (
            <p className="text-center text-sm text-gray-500 mt-2">Mark attendance first to calculate salary</p>
          )}
        </div>

        {/* ── Discount limit card ── */}
        <div className="bg-[#111] border border-amber-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag size={18} className="text-amber-400" />
            <h3 className="text-base font-bold text-amber-400">Max Discount Limit</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Set the maximum % discount this staff member can give on a sale.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex-1">
              <input
                type="number"
                min="0"
                max="100"
                value={discountLimit}
                onChange={e => setDiscountLimit(e.target.value)}
                className="w-full bg-transparent text-3xl font-bold text-amber-300 text-center outline-none"
              />
              <span className="text-amber-400 font-bold text-2xl">%</span>
            </div>
            <button
              onClick={saveDiscountLimit}
              disabled={savingDiscount}
              className={`px-5 py-4 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-50 ${
                discountSaved
                  ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                  : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
              }`}
            >
              {discountSaved ? '✓ Saved' : savingDiscount ? '...' : 'Save'}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {discPct === 0 ? 'No limit set — unlimited discounts allowed' : `Current limit: ${discPct}% — warning shown if exceeded`}
          </p>
        </div>

        {/* ── Attendance calendar ── */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-purple-400" />
            <h3 className="text-base font-bold text-white">{monthLabel} — Attendance</h3>
          </div>

          <div className="flex flex-wrap gap-3 mb-4 text-xs font-semibold">
            {[
              { color: 'bg-green-500', label: 'P = Present' },
              { color: 'bg-red-500',   label: 'A = Absent' },
              { color: 'bg-amber-400', label: '½ = Half Day' },
              { color: 'bg-blue-400',  label: 'H = Holiday' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-gray-500">
                <span className={`w-3 h-3 rounded-sm ${color} inline-block`} />
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: totalDays }, (_, i) => {
              const day = i + 1
              const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const status = attMap[dateStr] as AttendanceStatus | undefined
              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold ${
                    status ? `${STATUS_COLORS[status]} text-white` : 'bg-white/5 text-gray-600'
                  }`}
                >
                  <span className="text-[10px] leading-none opacity-75">{day}</span>
                  {status && <span className="text-[11px] leading-none mt-0.5">{STATUS_LABELS[status]}</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Salary history ── */}
        {salaryPayments.length > 0 && (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
            <h3 className="text-base font-bold text-white mb-3">Salary History</h3>
            <div className="space-y-2">
              {salaryPayments.map(p => {
                const mLabel = new Date(p.year, p.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                return (
                  <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl ${
                    p.status === 'paid' ? 'bg-green-500/10' : 'bg-white/5'
                  }`}>
                    <div>
                      <p className="text-sm font-semibold text-white">{mLabel}</p>
                      <p className="text-xs text-gray-500">
                        {p.present_days}/{p.working_days} days
                        {p.payment_date ? ` · Paid ${formatBSFull(new Date(p.payment_date + 'T00:00:00'))}` : ''}
                        {p.payment_method ? ` via ${p.payment_method}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-base ${p.status === 'paid' ? 'text-green-400' : 'text-white'}`}>
                        NPR {Number(p.payable_amount).toLocaleString('ne-NP')}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {p.status === 'paid' ? '✓ Paid' : 'Pending'}
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
