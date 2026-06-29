'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/db/supabase'
import { Download, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react'
import { PageSkeleton } from '@/components/ui/skeleton'
import type { Transaction, Customer } from '@/lib/types/database'

type Period = 'today' | 'week' | 'month' | 'custom'

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Today', week: 'This Week', month: 'This Month', custom: 'Custom',
}

function getDateRange(period: Period, customFrom: string, customTo: string): { start: string; end: string } {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (period === 'today') {
    return { start: today.toISOString(), end: new Date(today.getTime() + 86400000 - 1).toISOString() }
  }
  if (period === 'week') {
    const day = today.getDay()
    const mon = new Date(today); mon.setDate(today.getDate() + (day === 0 ? -6 : 1 - day))
    return { start: mon.toISOString(), end: new Date(today.getTime() + 86400000 - 1).toISOString() }
  }
  if (period === 'month') {
    return { start: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(), end: new Date(today.getTime() + 86400000 - 1).toISOString() }
  }
  const s = customFrom ? new Date(customFrom + 'T00:00:00').toISOString() : today.toISOString()
  const e = customTo   ? new Date(customTo   + 'T23:59:59').toISOString() : new Date(today.getTime() + 86400000 - 1).toISOString()
  return { start: s, end: e }
}

function fmtNPR(n: number) {
  return `NPR ${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}


export default function ReportsPage() {
  const [period,     setPeriod]     = useState<Period>('today')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo,   setCustomTo]   = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [customers,    setCustomers]    = useState<Customer[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data: biz } = await supabase.from('businesses').select('id').eq('owner_id', user.id).single()
    if (!biz) { setLoading(false); return }
    const { start, end } = getDateRange(period, customFrom, customTo)
    const [{ data: txs }, { data: custs }] = await Promise.all([
      supabase.from('transactions').select('*').eq('business_id', biz.id)
        .gte('created_at', start).lte('created_at', end).order('created_at', { ascending: false }),
      supabase.from('customers').select('id, balance').eq('business_id', biz.id),
    ])
    setTransactions((txs as Transaction[]) ?? [])
    setCustomers((custs as Customer[]) ?? [])
    setLoading(false)
  }, [period, customFrom, customTo])

  useEffect(() => { fetchData() }, [fetchData])

  const totalIncome  = useMemo(() => transactions.filter(t => t.type === 'income').reduce((s, t)  => s + Number(t.amount), 0), [transactions])
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0), [transactions])
  const net          = totalIncome - totalExpense
  const totalKhataOwed = useMemo(() => customers.reduce((s, c) => s + Math.max(0, Number(c.balance)), 0), [customers])

  const topSelling = useMemo(() => {
    const map = new Map<string, number>()
    transactions.filter(t => t.type === 'income').forEach(t => {
      const key = (t.item_name ?? 'Unnamed').split(' — ')[0].trim()
      map.set(key, (map.get(key) ?? 0) + Number(t.amount))
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [transactions])

  function handleExportCSV() {
    const { start, end } = getDateRange(period, customFrom, customTo)
    const label = PERIOD_LABELS[period]
    const rows = [
      ['PasalSathi Report', label],
      ['Period', `${new Date(start).toLocaleDateString()} – ${new Date(end).toLocaleDateString()}`],
      [],
      ['Date', 'Type', 'Item', 'Payment Method', 'Amount (NPR)'],
      ...transactions.map(t => [
        new Date(t.created_at).toLocaleDateString(), t.type,
        `"${(t.item_name ?? '').replace(/"/g, '""')}"`, t.payment_method ?? '', t.amount,
      ]),
      [], ['Total Income', totalIncome], ['Total Expense', totalExpense], ['Net', net],
      [], ['Khata Owed (all time)', totalKhataOwed],
    ]
    const csv  = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `PasalSathi-${label.replace(' ', '-')}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const inp = 'flex-1 bg-white border border-[#D5CFC6] rounded-xl px-3 py-2 text-[#1C1917] text-sm outline-none focus:border-[#C84B2F]'

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-32">

      {/* Sticky header */}
      <div className="sticky top-0 bg-[#F5F0E8]/90 backdrop-blur-xl border-b border-[#D5CFC6] z-20 px-4 pt-5 pb-3">
        <h1 className="text-2xl font-bold text-[#1C1917] mb-3 font-display">Reports</h1>

        <div className="relative">
          <button
            onClick={() => setShowPicker(p => !p)}
            className="flex items-center gap-2 bg-white border border-[#D5CFC6] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#1C1917] shadow-sm"
          >
            {PERIOD_LABELS[period]}
            <ChevronDown size={15} className={`text-[#9B948E] transition-transform ${showPicker ? 'rotate-180' : ''}`} />
          </button>
          {showPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-[#D5CFC6] rounded-xl shadow-lg z-30 overflow-hidden min-w-[160px]">
              {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
                <button key={p} onClick={() => { setPeriod(p); setShowPicker(false) }}
                  className={`w-full text-left px-4 py-3 text-sm font-semibold border-b border-[#E0D9CE] last:border-0 active:bg-[#F5F0E8] ${
                    period === p ? 'text-[#C84B2F]' : 'text-[#1C1917]'
                  }`}
                >{PERIOD_LABELS[p]}</button>
              ))}
            </div>
          )}
        </div>

        {period === 'custom' && (
          <div className="flex gap-2 mt-2">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className={inp} />
            <span className="text-[#9B948E] self-center text-sm">to</span>
            <input type="date" value={customTo}   onChange={e => setCustomTo(e.target.value)}   className={inp} />
          </div>
        )}
      </div>

      {loading ? <PageSkeleton rows={4} /> : (
        <div className="px-4 pt-4 space-y-4">

          {/* Income / Expense / Net */}
          <section className="bg-white border border-[#D5CFC6] rounded-2xl overflow-hidden shadow-sm divide-y divide-[#E0D9CE]">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-[#4A7055]" />
                <span className="text-sm font-semibold text-[#6B6560]">Income</span>
              </div>
              <p className="text-lg font-bold text-[#4A7055] font-mono">{fmtNPR(totalIncome)}</p>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <TrendingDown size={18} className="text-[#C84B2F]" />
                <span className="text-sm font-semibold text-[#6B6560]">Expense</span>
              </div>
              <p className="text-lg font-bold text-[#C84B2F] font-mono">{fmtNPR(totalExpense)}</p>
            </div>
            <div className={`flex items-center justify-between px-5 py-4 ${net >= 0 ? 'bg-[#4A7055]/5' : 'bg-[#C84B2F]/5'}`}>
              <span className="text-sm font-bold text-[#1C1917]">Net</span>
              <p className={`text-2xl font-black font-mono ${net >= 0 ? 'text-[#4A7055]' : 'text-[#C84B2F]'}`}>
                {net >= 0 ? '+' : ''}{fmtNPR(net)}
              </p>
            </div>
          </section>

          {/* Top Selling */}
          <section className="bg-white border border-[#D5CFC6] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-[#E0D9CE]">
              <p className="text-xs font-bold text-[#9B948E] uppercase tracking-widest">Top Selling</p>
            </div>
            {topSelling.length === 0 ? (
              <p className="text-center py-8 text-[#9B948E] text-sm">No sales in this period</p>
            ) : (
              <div className="divide-y divide-[#E0D9CE]">
                {topSelling.map(([item, total], i) => (
                  <div key={item} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-sm font-bold text-[#9B948E] w-5 shrink-0">#{i + 1}</span>
                    <span className="flex-1 text-sm font-semibold text-[#1C1917] truncate">{item}</span>
                    <span className="text-sm font-bold text-[#4A7055] shrink-0 font-mono">{fmtNPR(total)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Khata Owed */}
          <section className="bg-[#C84B2F]/8 border border-[#C84B2F]/20 rounded-2xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#C84B2F] uppercase tracking-widest mb-1">Khata Owed</p>
              <p className="text-xs text-[#9B948E]">Total outstanding (all customers)</p>
            </div>
            <p className="text-2xl font-black text-[#C84B2F] font-mono">{fmtNPR(totalKhataOwed)}</p>
          </section>

          {/* Transaction list */}
          {transactions.length > 0 && (
            <section>
              <p className="text-xs font-bold text-[#9B948E] uppercase tracking-widest mb-2 px-1">
                All Transactions ({transactions.length})
              </p>
              <div className="space-y-2">
                {transactions.map(tx => (
                  <div key={tx.id} className="bg-white border border-[#D5CFC6] rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1C1917] truncate">{tx.item_name ?? '—'}</p>
                      <p className="text-xs text-[#9B948E] mt-0.5">
                        {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' · '}{tx.payment_method ?? ''}
                      </p>
                    </div>
                    <p className={`text-sm font-bold shrink-0 font-mono ${tx.type === 'income' ? 'text-[#4A7055]' : 'text-[#C84B2F]'}`}>
                      {tx.type === 'income' ? '+' : '-'}{fmtNPR(Number(tx.amount))}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Export */}
          <button
            onClick={handleExportCSV}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#4A7055] text-white rounded-2xl font-bold text-base active:scale-[0.98] transition-all"
          >
            <Download size={20} /> Export CSV
          </button>

        </div>
      )}
    </div>
  )
}
