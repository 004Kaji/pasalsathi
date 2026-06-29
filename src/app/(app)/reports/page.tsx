'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/db/supabase'
import { Download, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react'
import { PageSkeleton } from '@/components/ui/skeleton'
import type { Transaction, Customer } from '@/lib/types/database'

type Period = 'today' | 'week' | 'month' | 'custom'

const PERIOD_LABELS: Record<Period, string> = {
  today:  'Today',
  week:   'This Week',
  month:  'This Month',
  custom: 'Custom',
}

/** Returns ISO start/end strings for the selected period */
function getDateRange(period: Period, customFrom: string, customTo: string): { start: string; end: string } {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (period === 'today') {
    return {
      start: today.toISOString(),
      end:   new Date(today.getTime() + 86400000 - 1).toISOString(),
    }
  }
  if (period === 'week') {
    const day  = today.getDay()
    const diff = (day === 0 ? -6 : 1 - day) // Monday as week start
    const mon  = new Date(today)
    mon.setDate(today.getDate() + diff)
    return {
      start: mon.toISOString(),
      end:   new Date(today.getTime() + 86400000 - 1).toISOString(),
    }
  }
  if (period === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    return {
      start: start.toISOString(),
      end:   new Date(today.getTime() + 86400000 - 1).toISOString(),
    }
  }
  // custom
  const s = customFrom ? new Date(customFrom + 'T00:00:00').toISOString() : today.toISOString()
  const e = customTo   ? new Date(customTo   + 'T23:59:59').toISOString() : new Date(today.getTime() + 86400000 - 1).toISOString()
  return { start: s, end: e }
}

function fmtNPR(n: number) {
  return `NPR ${n.toLocaleString('ne-NP', { maximumFractionDigits: 0 })}`
}

export default function ReportsPage() {
  const [period,      setPeriod]      = useState<Period>('today')
  const [customFrom,  setCustomFrom]  = useState('')
  const [customTo,    setCustomTo]    = useState('')
  const [showPicker,  setShowPicker]  = useState(false)

  const [loading,      setLoading]      = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [customers,    setCustomers]    = useState<Customer[]>([])
  const [bizId,        setBizId]        = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: biz } = await supabase
      .from('businesses').select('id').eq('owner_id', user.id).single()
    if (!biz) { setLoading(false); return }
    setBizId(biz.id)

    const { start, end } = getDateRange(period, customFrom, customTo)

    const [{ data: txs }, { data: custs }] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('business_id', biz.id)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false }),
      supabase
        .from('customers')
        .select('id, balance')
        .eq('business_id', biz.id),
    ])

    setTransactions((txs as Transaction[]) ?? [])
    setCustomers((custs as Customer[]) ?? [])
    setLoading(false)
  }, [period, customFrom, customTo])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Aggregations ──────────────────────────────────────────────────────────

  const totalIncome  = useMemo(() => transactions.filter(t => t.type === 'income').reduce((s, t)  => s + Number(t.amount), 0), [transactions])
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0), [transactions])
  const net          = totalIncome - totalExpense

  const totalKhataOwed = useMemo(() =>
    customers.reduce((s, c) => s + Math.max(0, Number(c.balance)), 0),
    [customers]
  )

  // Group income transactions by item_name, sum amounts, sort desc
  const topSelling = useMemo(() => {
    const map = new Map<string, number>()
    transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const key = (t.item_name ?? 'Unnamed').split(' — ')[0].trim() // strip "CustomerName — " prefix
        map.set(key, (map.get(key) ?? 0) + Number(t.amount))
      })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [transactions])

  // ── CSV Export ────────────────────────────────────────────────────────────

  function handleExportCSV() {
    const { start, end } = getDateRange(period, customFrom, customTo)
    const label = PERIOD_LABELS[period]

    const rows = [
      ['PasalSathi Report', label],
      ['Period', `${new Date(start).toLocaleDateString()} – ${new Date(end).toLocaleDateString()}`],
      [],
      ['Date', 'Type', 'Item', 'Payment Method', 'Amount (NPR)'],
      ...transactions.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        t.type,
        `"${(t.item_name ?? '').replace(/"/g, '""')}"`,
        t.payment_method ?? '',
        t.amount,
      ]),
      [],
      ['Total Income',  totalIncome],
      ['Total Expense', totalExpense],
      ['Net',           net],
      [],
      ['Khata Owed (all time)', totalKhataOwed],
    ]

    const csv  = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `PasalSathi-${label.replace(' ', '-')}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">

      {/* Sticky header */}
      <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 z-20 px-4 pt-5 pb-3">
        <h1 className="text-2xl font-bold text-white mb-3">📊 Reports</h1>

        {/* Period selector */}
        <div className="relative">
          <button
            onClick={() => setShowPicker(p => !p)}
            className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          >
            {PERIOD_LABELS[period]}
            <ChevronDown size={15} className={`text-gray-400 transition-transform ${showPicker ? 'rotate-180' : ''}`} />
          </button>

          {showPicker && (
            <div className="absolute top-full left-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-30 overflow-hidden min-w-[160px]">
              {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => { setPeriod(p); setShowPicker(false) }}
                  className={`w-full text-left px-4 py-3 text-sm font-semibold border-b border-white/5 last:border-0 active:bg-white/5 ${
                    period === p ? 'text-orange-400' : 'text-white'
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Custom date range inputs */}
        {period === 'custom' && (
          <div className="flex gap-2 mt-2">
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-orange-500/50"
            />
            <span className="text-gray-500 self-center text-sm">to</span>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-orange-500/50"
            />
          </div>
        )}
      </div>

      {loading ? (
        <PageSkeleton rows={4} />
      ) : (
        <div className="px-4 pt-4 space-y-4">

          {/* ── Income / Expense / Net ── */}
          <section className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-green-400" />
                <span className="text-sm font-semibold text-gray-400">Income</span>
              </div>
              <p className="text-lg font-bold text-green-400">{fmtNPR(totalIncome)}</p>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <TrendingDown size={18} className="text-red-400" />
                <span className="text-sm font-semibold text-gray-400">Expense</span>
              </div>
              <p className="text-lg font-bold text-red-400">{fmtNPR(totalExpense)}</p>
            </div>
            <div className={`flex items-center justify-between px-5 py-4 ${net >= 0 ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
              <span className="text-sm font-bold text-gray-300">Net</span>
              <p className={`text-xl font-black ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {net >= 0 ? '+' : ''}{fmtNPR(net)}
              </p>
            </div>
          </section>

          {/* ── Top Selling ── */}
          <section className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Top Selling</p>
            </div>
            {topSelling.length === 0 ? (
              <p className="text-center py-8 text-gray-600 text-sm">No sales in this period</p>
            ) : (
              <div className="divide-y divide-white/5">
                {topSelling.map(([item, total], i) => (
                  <div key={item} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-sm font-bold text-gray-600 w-5 shrink-0">#{i + 1}</span>
                    <span className="flex-1 text-sm font-semibold text-white truncate">{item}</span>
                    <span className="text-sm font-bold text-green-400 shrink-0">{fmtNPR(total)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Khata Owed ── */}
          <section className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Khata Owed</p>
              <p className="text-xs text-gray-500">Total outstanding (all customers)</p>
            </div>
            <p className="text-2xl font-black text-amber-400">{fmtNPR(totalKhataOwed)}</p>
          </section>

          {/* ── Transaction list ── */}
          {transactions.length > 0 && (
            <section>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
                All Transactions ({transactions.length})
              </p>
              <div className="space-y-2">
                {transactions.map(tx => (
                  <div key={tx.id} className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{tx.item_name ?? '—'}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' · '}{tx.payment_method ?? ''}
                      </p>
                    </div>
                    <p className={`text-sm font-bold shrink-0 ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{fmtNPR(Number(tx.amount))}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Export CSV ── */}
          <button
            onClick={handleExportCSV}
            className="w-full flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-2xl font-bold text-base active:scale-[0.98] transition-all"
          >
            <Download size={20} /> Export CSV
          </button>

        </div>
      )}
    </div>
  )
}
