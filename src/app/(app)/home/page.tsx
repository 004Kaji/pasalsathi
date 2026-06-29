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

  if (!business) redirect('/home')

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const [{ data: todayTx }, { data: recentSales }] = await Promise.all([
    supabase.from('transactions').select('type, amount')
      .eq('business_id', business.id)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString()),
    supabase.from('transactions').select('id, item_name, amount, payment_method, type')
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
    <div className="pb-8 px-4 pt-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#9B948E] font-medium">📅 {bsDate}</p>
          <h1 className="text-3xl font-bold text-[#1C1917] mt-1 font-display">{business.name}</h1>
        </div>
        <div className="flex gap-2 mt-2">
          <Link href="/reports" className="p-2.5 rounded-xl bg-white border border-[#D5CFC6] text-[#6B6560] active:scale-95 transition-transform shadow-sm">
            <FileText size={20} />
          </Link>
          <Link href="/settings" className="p-2.5 rounded-xl bg-white border border-[#D5CFC6] text-[#6B6560] active:scale-95 transition-transform shadow-sm">
            <Settings size={20} />
          </Link>
        </div>
      </div>

      {/* Today summary */}
      <div className="bg-white border border-[#D5CFC6] rounded-2xl p-5 space-y-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#9B948E]">Today&apos;s Summary</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-[#4A7055]" />
            <span className="text-sm text-[#6B6560] font-medium">Sales</span>
          </div>
          <span className="text-lg font-bold text-[#4A7055] font-mono">{formatNPR(sales)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="text-[#C84B2F]" />
            <span className="text-sm text-[#6B6560] font-medium">Expenses</span>
          </div>
          <span className="text-lg font-bold text-[#C84B2F] font-mono">{formatNPR(expenses)}</span>
        </div>

        <div className="h-px bg-[#E0D9CE]" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-[#1C1917]" />
            <span className="text-sm text-[#6B6560] font-medium">Net</span>
          </div>
          <span className={`text-2xl font-black font-mono ${net >= 0 ? 'text-[#4A7055]' : 'text-[#C84B2F]'}`}>
            {net >= 0 ? '+' : ''}{formatNPR(net)}
          </span>
        </div>
      </div>

      {/* Quick Sell CTA */}
      <Link
        href="/sell"
        className="flex items-center justify-center gap-3 w-full py-5 bg-[#C84B2F] rounded-2xl text-white font-bold text-xl active:scale-[0.98] transition-transform shadow-lg"
      >
        <ShoppingCart size={26} />
        Quick Sell
      </Link>

      {/* Recent Sales */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-base font-bold text-[#1C1917]">Recent Sales</p>
          <Link href="/hisab" className="text-sm text-[#C84B2F] font-medium flex items-center gap-0.5">
            View All <ChevronRight size={15} />
          </Link>
        </div>

        {(recentSales ?? []).length === 0 ? (
          <div className="bg-white border border-[#D5CFC6] rounded-2xl p-8 text-center shadow-sm">
            <p className="text-4xl mb-2">🏪</p>
            <p className="text-[#6B6560] text-sm font-medium">No sales yet</p>
            <p className="text-[#9B948E] text-xs mt-1">Tap Quick Sell to record your first sale</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(recentSales as Transaction[]).map(tx => (
              <Link key={tx.id} href={`/hisab/${tx.id}`}>
                <div className="bg-white border border-[#D5CFC6] rounded-2xl px-4 py-4 flex items-center justify-between active:scale-[0.99] transition-transform shadow-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1C1917] truncate">{tx.item_name}</p>
                    <p className="text-xs text-[#9B948E] mt-0.5">
                      {PM_EMOJI[tx.payment_method]} {PM_LABEL[tx.payment_method] ?? tx.payment_method}
                    </p>
                  </div>
                  <p className="text-base font-bold text-[#4A7055] ml-3 shrink-0 font-mono">
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
