import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/db/supabase-server'
import { todayBS, daysInBSMonth, firstWeekdayOfBSMonth, BS_MONTHS, BS_DAYS_SHORT } from '@/lib/utils/date'
import { formatNPR } from '@/lib/utils/currency'
import { getUpcomingFestivals, festivalsOnDay } from '@/lib/utils/festivals'
import { ShoppingCart, TrendingDown, TrendingUp, Users, BarChart2 } from 'lucide-react'
import type { Customer } from '@/lib/types/database'

const BS_MONTHS_EN = [
  'Baisakh','Jestha','Asar','Shrawan','Bhadra','Aswin',
  'Kartik','Mangsir','Poush','Magh','Falgun','Chaitra',
]

export default async function HomePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/home')

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const [{ data: todayTx }, { data: khataCustomers }] = await Promise.all([
    supabase.from('transactions').select('type, amount')
      .eq('business_id', business.id)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString()),
    supabase.from('customers').select('id, name, balance')
      .eq('business_id', business.id)
      .gt('balance', 0)
      .order('balance', { ascending: false })
      .limit(4),
  ])

  const todaySales = (todayTx ?? [])
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0)

  // BS calendar data
  const bs        = todayBS()
  const bsYear    = bs.year
  const bsMonth   = bs.month
  const bsDay     = bs.date
  const totalDays = daysInBSMonth(bsYear, bsMonth)
  const startDay  = firstWeekdayOfBSMonth(bsYear, bsMonth)   // 0 = Sun

  // Festival data
  const upcoming     = getUpcomingFestivals(bsYear, bsMonth, bsDay)
  const festivalDays = new Map<number, string>()
  for (let d = 1; d <= totalDays; d++) {
    const fests = festivalsOnDay(bsYear, bsMonth, d)
    if (fests.length) festivalDays.set(d, fests[0].emoji)
  }

  // Calendar grid: pad start with nulls
  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  // Pad end to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="px-4 pt-6 pb-8 space-y-5">

      {/* Header */}
      <div>
        <p className="text-xs text-[#9B948E] font-medium">
          {BS_MONTHS_EN[bsMonth - 1]} {bsDay}, {bsYear}
        </p>
        <h1 className="text-3xl font-bold text-[#1C1917] mt-0.5 font-display">{business.name}</h1>
      </div>

      {/* Quick actions — 2×2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/sell"
          className="bg-[#C84B2F] rounded-2xl px-4 py-5 flex items-center gap-3 active:scale-[0.97] transition-transform shadow-sm">
          <ShoppingCart size={22} className="text-white" />
          <span className="font-bold text-white text-base">Sell</span>
        </Link>
        <Link href="/hisab/new?type=expense"
          className="bg-white border border-[#D5CFC6] rounded-2xl px-4 py-5 flex items-center gap-3 active:scale-[0.97] transition-transform shadow-sm">
          <TrendingDown size={22} className="text-[#C84B2F]" />
          <span className="font-bold text-[#1C1917] text-base">Expense</span>
        </Link>
        <Link href="/khata"
          className="bg-white border border-[#D5CFC6] rounded-2xl px-4 py-5 flex items-center gap-3 active:scale-[0.97] transition-transform shadow-sm">
          <Users size={22} className="text-[#C9933A]" />
          <span className="font-bold text-[#1C1917] text-base">Khata</span>
        </Link>
        <Link href="/reports"
          className="bg-white border border-[#D5CFC6] rounded-2xl px-4 py-5 flex items-center gap-3 active:scale-[0.97] transition-transform shadow-sm">
          <BarChart2 size={22} className="text-[#4A7055]" />
          <span className="font-bold text-[#1C1917] text-base">Reports</span>
        </Link>
      </div>

      {/* Upcoming Festivals */}
      {upcoming.length > 0 && (
        <div className="bg-white border border-[#D5CFC6] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-[#E0D9CE]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#9B948E]">Upcoming Festivals</p>
          </div>
          <div className="divide-y divide-[#E0D9CE]">
            {upcoming.map(f => (
              <div key={f.id + f.bsYear} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{f.emoji}</span>
                  <span className="text-sm font-semibold text-[#1C1917]">{f.name}</span>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  f.daysAway === 0
                    ? 'bg-[#C84B2F]/10 text-[#C84B2F]'
                    : f.daysAway <= 7
                    ? 'bg-[#C9933A]/10 text-[#C9933A]'
                    : 'bg-[#F5F0E8] text-[#9B948E]'
                }`}>
                  {f.daysAway === 0 ? 'Today!' : f.daysAway === 1 ? 'Tomorrow' : `${f.daysAway} days`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BS Calendar */}
      <div className="bg-white border border-[#D5CFC6] rounded-2xl overflow-hidden shadow-sm">
        {/* Month header */}
        <div className="px-5 py-4 border-b border-[#E0D9CE] flex items-center justify-between">
          <p className="font-bold text-[#1C1917] text-base">
            {BS_MONTHS[bsMonth - 1]} {bsYear}
          </p>
          <p className="text-xs text-[#9B948E]">{BS_MONTHS_EN[bsMonth - 1]} {bsYear}</p>
        </div>

        <div className="px-3 py-3">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {BS_DAYS_SHORT.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-[#9B948E] py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />
              const isToday   = day === bsDay
              const festEmoji = festivalDays.get(day)
              return (
                <div key={day} className="flex flex-col items-center py-1">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    isToday
                      ? 'bg-[#C84B2F] text-white font-bold'
                      : festEmoji
                      ? 'text-[#C9933A] font-bold'
                      : 'text-[#1C1917]'
                  }`}>
                    {day}
                  </div>
                  {festEmoji && (
                    <span className="text-[10px] leading-none mt-0.5">{festEmoji}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Today's Income */}
      <div className="bg-white border border-[#D5CFC6] rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4A7055]/10 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} className="text-[#4A7055]" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#9B948E]">Today&apos;s Income</p>
            <p className="text-2xl font-black text-[#4A7055] font-mono mt-0.5">{formatNPR(todaySales)}</p>
          </div>
        </div>
        <Link href="/sell" className="text-xs text-[#C84B2F] font-semibold">
          Sell →
        </Link>
      </div>

      {/* Khata Alerts */}
      {(khataCustomers ?? []).length > 0 && (
        <div className="bg-white border border-[#D5CFC6] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-[#E0D9CE] flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#9B948E]">Khata Outstanding</p>
            <Link href="/khata" className="text-xs text-[#C84B2F] font-semibold">View all →</Link>
          </div>
          <div className="divide-y divide-[#E0D9CE]">
            {(khataCustomers as Customer[]).map(c => (
              <Link key={c.id} href={`/khata/${c.id}`}
                className="flex items-center justify-between px-5 py-3.5 active:bg-[#F5F0E8]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#C9933A]/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-[#C9933A]">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[#1C1917]">{c.name}</span>
                </div>
                <span className="text-sm font-bold text-[#C9933A] font-mono">
                  {formatNPR(Number(c.balance))}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
