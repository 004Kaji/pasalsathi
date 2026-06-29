import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/db/supabase-server'
import { formatNPR } from '@/lib/utils/currency'
import { todayBS } from '@/lib/utils/date'
import { TrendingUp, TrendingDown, Wallet, ChevronRight, ShoppingCart, Settings, FileText } from 'lucide-react'
import type { Transaction } from '@/lib/types/database'

const BS_MONTHS_EN = [
  'Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Aswin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
]

const PM_EMOJI: Record<string, string> = {
  cash: '💵', khata: '📒', esewa: '🟢', khalti: '🟣',
}

const PM_LABEL: Record<string, string> = {
  cash: 'Cash', khata: 'Khata', esewa: 'eSewa', khalti: 'Khalti',
}

export default async function HomePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/onboarding')

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const [{ data: todayTx }, { data: recentSales }] = await Promise.all([
    supabase
      .from('transactions')
      .select('type, amount')
      .eq('business_id', business.id)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString()),
    supabase
      .from('transactions')
      .select('id, item_name, amount, payment_method, type')
      .eq('business_id', business.id)
      .eq('type', 'income')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const sales    = (todayTx ?? []).filter(t => t.type === 'income').reduce((s, t)  => s + Number(t.amount), 0)
  const expenses = (todayTx ?? []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const net      = sales - expenses

  const bs = todayBS()
  const bsDate = `${BS_MONTHS_EN[bs.month - 1]} ${bs.date}, ${bs.year}`

  return (
    <div className="pb-8 px-4 pt-5 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">📅 {bsDate}</p>
          <h1 className="text-2xl font-bold text-white mt-1">{business.name}</h1>
        </div>
        <div className="flex gap-2 mt-1">
          <Link
            href="/reports"
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 active:scale-95 transition-transform"
          >
            <FileText size={20} />
          </Link>
          <Link
            href="/settings"
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 active:scale-95 transition-transform"
          >
            <Settings size={20} />
          </Link>
        </div>
      </div>

      {/* TODAY summary */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">Today</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-green-400" />
            <span className="text-sm text-gray-400">Sales</span>
          </div>
          <span className="text-lg font-bold text-green-400">{formatNPR(sales)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown size={15} className="text-red-400" />
            <span className="text-sm text-gray-400">Expenses</span>
          </div>
          <span className="text-lg font-bold text-red-400">{formatNPR(expenses)}</span>
        </div>

        <div className="h-px bg-white/10" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={15} className={net >= 0 ? 'text-blue-400' : 'text-orange-400'} />
            <span className="text-sm text-gray-400">Net</span>
          </div>
          <span className={`text-xl font-black ${net >= 0 ? 'text-blue-300' : 'text-orange-300'}`}>
            {net >= 0 ? '+' : ''}{formatNPR(net)}
          </span>
        </div>
      </div>

      {/* Quick Sell */}
      <Link
        href="/sell"
        className="flex items-center justify-center gap-3 w-full py-5 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl text-white font-bold text-xl active:scale-[0.98] transition-transform shadow-lg shadow-orange-600/20"
      >
        <ShoppingCart size={26} />
        Quick Sell
      </Link>

      {/* Recent Sales */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-base font-bold text-white">Recent Sales</p>
          <Link
            href="/hisab"
            className="text-sm text-orange-400 font-medium hover:text-orange-300 flex items-center gap-0.5"
          >
            View All <ChevronRight size={15} />
          </Link>
        </div>

        {(recentSales ?? []).length === 0 ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-4xl mb-2">🏪</p>
            <p className="text-gray-500 text-sm">No sales yet</p>
            <p className="text-gray-600 text-xs mt-1">Tap Quick Sell to record your first sale</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(recentSales as Transaction[]).map(tx => (
              <Link key={tx.id} href={`/hisab/${tx.id}`}>
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3.5 flex items-center justify-between active:scale-[0.99] transition-transform">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{tx.item_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {PM_EMOJI[tx.payment_method]} {PM_LABEL[tx.payment_method] ?? tx.payment_method}
                    </p>
                  </div>
                  <p className="text-base font-bold text-green-400 ml-3 shrink-0">
                    +{formatNPR(Number(tx.amount))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
