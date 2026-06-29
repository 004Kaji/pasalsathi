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
    .from('businesses').select('id, name, phone, address').eq('owner_id', user.id).single()

  if (!business) redirect('/home')

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const [{ data: todayTx }, { data: khataCustomers }, { count: productCount }, { count: khataCount }] = await Promise.all([
    supabase.from('transactions').select('type, amount')
      .eq('business_id', business.id)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString()),
    supabase.from('customers').select('id, name, balance')
      .eq('business_id', business.id)
      .gt('balance', 0)
      .order('balance', { ascending: false })
      .limit(4),
    supabase.from('products').select('id', { count: 'exact', head: true })
      .eq('business_id', business.id),
    supabase.from('customers').select('id', { count: 'exact', head: true })
      .eq('business_id', business.id),
  ])

  // Onboarding checklist
  const profileDone  = !!(business.phone || business.address)
  const productsDone = (productCount ?? 0) > 0
  const khataDone    = (khataCount ?? 0) > 0
  const allDone      = profileDone && productsDone && khataDone

  const todaySales = (todayTx ?? [])
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0)

  // ── BS calendar ──────────────────────────────────────────
  const bs        = todayBS()
  const bsYear    = bs.year
  const bsMonth   = bs.month
  const bsDay     = bs.date
  const totalDays = daysInBSMonth(bsYear, bsMonth)
  const startDay  = firstWeekdayOfBSMonth(bsYear, bsMonth) // 0 = Sun

  // AD date of BS day 1 (for showing AD date in each cell)
  const adDay1 = new Date(todayStart.getTime() - (bsDay - 1) * 86_400_000)

  // Build cell array: null = empty, number = BS day
  const cells: (number | null)[] = [
    ...Array<null>(startDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const upcoming = getUpcomingFestivals(bsYear, bsMonth, bsDay, 2)

  return (
    <div className="px-4 pt-6 pb-8 space-y-5">

      {/* Header */}
      <div>
        <p className="text-xs text-[#9B948E] font-medium">
          {BS_MONTHS_EN[bsMonth - 1]} {bsDay}, {bsYear}
        </p>
        <h1 className="text-3xl font-bold text-[#1C1917] mt-0.5 font-display">{business.name}</h1>
      </div>

      {/* Onboarding checklist — hidden once all done */}
      {!allDone && (
        <div className="bg-white border border-[#D5CFC6] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-[#E0D9CE] flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#1C1917]">Get started 🚀</p>
              <p className="text-xs text-[#9B948E] mt-0.5">
                {[profileDone, productsDone, khataDone].filter(Boolean).length} of 3 done
              </p>
            </div>
            <div className="flex gap-1">
              {[profileDone, productsDone, khataDone].map((done, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${done ? 'bg-[#4A7055]' : 'bg-[#E0D9CE]'}`} />
              ))}
            </div>
          </div>
          <div className="divide-y divide-[#E0D9CE]">
            {[
              {
                done: profileDone,
                emoji: '🏪',
                title: 'Complete business profile',
                sub: 'Add your address and phone number',
                href: '/settings',
              },
              {
                done: productsDone,
                emoji: '📦',
                title: 'Add your first product',
                sub: 'Add items you sell to use the POS',
                href: '/products/new',
              },
              {
                done: khataDone,
                emoji: '📒',
                title: 'Add first khata customer',
                sub: 'Track who owes you money',
                href: '/khata/new',
              },
            ].map(item => (
              <Link
                key={item.title}
                href={item.done ? '#' : item.href}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${item.done ? 'pointer-events-none' : 'active:bg-[#F5F0E8]'}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  item.done ? 'bg-[#4A7055]/10' : 'bg-[#F5F0E8]'
                }`}>
                  {item.done
                    ? <span className="text-[#4A7055] font-bold text-lg">✓</span>
                    : <span className="text-lg">{item.emoji}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${item.done ? 'line-through text-[#9B948E]' : 'text-[#1C1917]'}`}>
                    {item.title}
                  </p>
                  {!item.done && <p className="text-xs text-[#9B948E] mt-0.5">{item.sub}</p>}
                </div>
                {!item.done && <span className="text-[#C84B2F] text-xs font-bold shrink-0">→</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
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

      {/* Upcoming Festivals — max 2 */}
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
                  f.daysAway === 0 ? 'bg-[#C84B2F]/10 text-[#C84B2F]'
                  : f.daysAway <= 7 ? 'bg-[#C9933A]/10 text-[#C9933A]'
                  : 'bg-[#F5F0E8] text-[#9B948E]'
                }`}>
                  {f.daysAway === 0 ? 'Today!' : f.daysAway === 1 ? 'Tomorrow' : `${f.daysAway} days`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BS Calendar — dark themed */}
      <div className="bg-[#1C1917] rounded-2xl overflow-hidden shadow-lg">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between border-b border-white/10">
          <div>
            <p className="text-2xl font-bold text-white font-display">
              {BS_MONTHS[bsMonth - 1]}
            </p>
            <p className="text-white/40 text-xs mt-0.5">
              {BS_MONTHS_EN[bsMonth - 1]} {bsYear} BS
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Today</p>
            <p className="text-[#C84B2F] font-bold text-lg leading-tight">{bsDay}</p>
            <p className="text-white/40 text-[10px]">{BS_MONTHS_EN[bsMonth - 1]}</p>
          </div>
        </div>

        <div className="px-3 pt-3 pb-4">
          {/* Day-of-week headers — शनि (Saturday) in red */}
          <div className="grid grid-cols-7 mb-2">
            {BS_DAYS_SHORT.map((d, i) => (
              <div key={d}
                className={`text-center text-[10px] font-bold py-1 ${i === 6 ? 'text-red-400' : 'text-white/35'}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />

              const col       = (startDay + day - 1) % 7
              const isSat     = col === 6
              const isToday   = day === bsDay
              const fests     = festivalsOnDay(bsYear, bsMonth, day)
              const hasFest   = fests.length > 0
              const adDate    = new Date(adDay1.getTime() + (day - 1) * 86_400_000)
              const adDay     = adDate.getDate()
              const festLabel = fests[0]?.name.split(/[\s(]/)[0] ?? '' // first word only

              return (
                <div key={day} className="flex flex-col items-center py-1">
                  {/* BS date circle */}
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                    isToday  ? 'bg-[#C84B2F] text-white'
                    : hasFest ? 'text-[#C9933A]'
                    : isSat   ? 'text-red-400'
                    : 'text-white'
                  }`}>
                    {day}
                  </div>
                  {/* AD date */}
                  <span className={`text-[9px] leading-none mt-0.5 ${isToday ? 'text-white/60' : 'text-white/25'}`}>
                    {adDay}
                  </span>
                  {/* Festival label */}
                  {hasFest && (
                    <span className="text-[8px] text-[#C9933A] leading-tight text-center mt-0.5 max-w-[36px] truncate">
                      {festLabel}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/10 px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#C84B2F]" />
              <span className="text-[10px] text-white/40">Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#C9933A]/40" />
              <span className="text-[10px] text-white/40">Festival</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/40" />
              <span className="text-[10px] text-white/40">Saturday</span>
            </div>
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
        <Link href="/sell" className="text-xs text-[#C84B2F] font-semibold">Sell →</Link>
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
                    <span className="text-sm font-bold text-[#C9933A]">{c.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1C1917]">{c.name}</span>
                </div>
                <span className="text-sm font-bold text-[#C9933A] font-mono">{formatNPR(Number(c.balance))}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
