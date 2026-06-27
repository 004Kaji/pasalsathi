import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSubscriptionStatus } from '@/lib/subscription'
import {
  TrendingUp, TrendingDown, Wallet, Users, Package, UserCheck,
  Settings, FileText, ChevronRight, AlertTriangle
} from 'lucide-react'
import type { Business } from '@/types/database'

function formatNPR(amount: number): string {
  return `NPR ${amount.toLocaleString('ne-NP')}`
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/onboarding')

  const today = getTodayDate()
  const bizId = business.id

  // Fetch all dashboard data in parallel
  const [
    { data: todayTx },
    { data: customers },
    { data: lowStockProducts },
    { data: allStaff },
    { data: todayAttendance },
  ] = await Promise.all([
    supabase
      .from('transactions')
      .select('type, amount')
      .eq('business_id', bizId)
      .eq('transaction_date', today),
    supabase
      .from('customers')
      .select('total_credit, total_paid')
      .eq('business_id', bizId),
    supabase
      .from('products')
      .select('id, current_stock, low_stock_threshold')
      .eq('business_id', bizId)
      .eq('is_active', true),
    supabase
      .from('staff')
      .select('id')
      .eq('business_id', bizId)
      .eq('is_active', true),
    supabase
      .from('attendance')
      .select('status')
      .eq('business_id', bizId)
      .eq('attendance_date', today),
  ])

  const cashIn = (todayTx ?? [])
    .filter((t) => t.type === 'in')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const cashOut = (todayTx ?? [])
    .filter((t) => t.type === 'out')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const netCash = cashIn - cashOut

  const totalOutstanding = (customers ?? []).reduce(
    (sum, c) => sum + Math.max(0, Number(c.total_credit) - Number(c.total_paid)),
    0
  )

  const lowStockCount = (lowStockProducts ?? []).filter(
    (p) => Number(p.current_stock) <= Number(p.low_stock_threshold)
  ).length
  const totalStaff = allStaff?.length ?? 0
  const presentToday = (todayAttendance ?? []).filter(
    (a) => a.status === 'present' || a.status === 'half_day'
  ).length

  const subStatus = getSubscriptionStatus(business as Business)
  const greeting = getGreeting()

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-base">{greeting}</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{business.name}</h1>
          {subStatus.status === 'trial' && (
            <span className="text-sm text-orange-600 font-medium">
              नि:शुल्क परीक्षण — {subStatus.daysLeft} दिन बाँकी
            </span>
          )}
        </div>
        <div className="flex gap-2 mt-1">
          <Link
            href="/report"
            className="p-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95 transition-transform"
            aria-label="रिपोर्ट"
          >
            <FileText size={22} />
          </Link>
          <Link
            href="/settings"
            className="p-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95 transition-transform"
            aria-label="सेटिङ"
          >
            <Settings size={22} />
          </Link>
        </div>
      </div>

      {/* Today's Date */}
      <p className="text-sm text-gray-400 -mt-2">
        आज: {formatNepaliDate()}
      </p>

      {/* Main cash widgets — 3 big cards */}
      <div className="space-y-3">
        {/* Cash In */}
        <Link href="/hisab" className="block">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center justify-between active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 rounded-xl p-3">
                <TrendingUp size={28} className="text-green-600" />
              </div>
              <div>
                <p className="text-green-700 text-base font-medium">आजको आम्दानी</p>
                <p className="text-green-900 text-3xl font-bold mt-0.5">
                  {formatNPR(cashIn)}
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-green-400" />
          </div>
        </Link>

        {/* Cash Out */}
        <Link href="/hisab" className="block">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center justify-between active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 rounded-xl p-3">
                <TrendingDown size={28} className="text-red-600" />
              </div>
              <div>
                <p className="text-red-700 text-base font-medium">आजको खर्च</p>
                <p className="text-red-900 text-3xl font-bold mt-0.5">
                  {formatNPR(cashOut)}
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-red-400" />
          </div>
        </Link>

        {/* Net Cash */}
        <div className={`rounded-2xl p-5 border-2 ${netCash >= 0 ? 'bg-blue-50 border-blue-300' : 'bg-orange-50 border-orange-300'}`}>
          <div className="flex items-center gap-4">
            <div className={`rounded-xl p-3 ${netCash >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
              <Wallet size={28} className={netCash >= 0 ? 'text-blue-600' : 'text-orange-600'} />
            </div>
            <div>
              <p className={`text-base font-medium ${netCash >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                आजको नाफा / नोक्सान
              </p>
              <p className={`text-3xl font-bold mt-0.5 ${netCash >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                {netCash >= 0 ? '+' : ''}{formatNPR(netCash)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Secondary widgets — 3 cards in 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        {/* Khata Outstanding */}
        <Link href="/khata" className="block col-span-2">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 rounded-xl p-2.5">
                <Users size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-amber-700 text-sm font-medium">कुल बाँकी उधारो</p>
                <p className="text-amber-900 text-2xl font-bold">
                  {formatNPR(totalOutstanding)}
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-amber-400" />
          </div>
        </Link>

        {/* Low Stock */}
        <Link href="/godam" className="block">
          <div className={`rounded-2xl p-4 border h-full flex flex-col justify-between active:scale-[0.98] transition-transform ${lowStockCount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className={`rounded-xl p-2.5 w-fit ${lowStockCount > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              {lowStockCount > 0
                ? <AlertTriangle size={24} className="text-red-500" />
                : <Package size={24} className="text-gray-500" />
              }
            </div>
            <div className="mt-3">
              <p className={`text-sm font-medium ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                कम स्टक
              </p>
              <p className={`text-3xl font-bold ${lowStockCount > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                {lowStockCount}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">वस्तुहरू</p>
            </div>
          </div>
        </Link>

        {/* Staff Present */}
        <Link href="/staff" className="block">
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 h-full flex flex-col justify-between active:scale-[0.98] transition-transform">
            <div className="bg-purple-100 rounded-xl p-2.5 w-fit">
              <UserCheck size={24} className="text-purple-600" />
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium text-purple-600">स्टाफ उपस्थित</p>
              <p className="text-3xl font-bold text-purple-900">
                {presentToday}
                <span className="text-xl text-purple-400">/{totalStaff}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">आज उपस्थित</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-base font-semibold text-gray-700 mb-3">छिटो काम</p>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction href="/hisab/new" label="हिसाब थप्नुहोस्" color="green" />
          <QuickAction href="/khata/new" label="उधारो थप्नुहोस्" color="amber" />
          <QuickAction href="/godam/new" label="सामान थप्नुहोस्" color="blue" />
          <QuickAction href="/staff/attendance" label="हाजिरी भर्नुहोस्" color="purple" />
        </div>
      </div>
    </div>
  )
}

function QuickAction({
  href,
  label,
  color,
}: {
  href: string
  label: string
  color: 'green' | 'amber' | 'blue' | 'purple'
}) {
  const styles = {
    green: 'bg-green-600 hover:bg-green-700',
    amber: 'bg-amber-500 hover:bg-amber-600',
    blue: 'bg-blue-600 hover:bg-blue-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
  }
  return (
    <Link
      href={href}
      className={`${styles[color]} text-white rounded-2xl p-4 text-center text-base font-semibold active:scale-[0.97] transition-transform`}
    >
      + {label}
    </Link>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'शुभ प्रभात 🌅'
  if (hour < 17) return 'शुभ दिन ☀️'
  return 'शुभ साँझ 🌙'
}

function formatNepaliDate(): string {
  return new Date().toLocaleDateString('ne-NP', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
