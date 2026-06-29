'use client'
/**
 * reports/page.tsx
 * Monthly income/expense report filtered by Bikram Sambat month.
 * Uses simplified schema columns: type (income/expense), amount, item_name, payment_method, created_at.
 * No category, description, or transaction_date — filters by created_at date range.
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/db/supabase'
import { Download, FileSpreadsheet, TrendingUp, TrendingDown } from 'lucide-react'
import { todayBS, daysInBSMonth } from '@/lib/utils/date'
import NepaliDate from 'nepali-date-converter'
import type { Transaction } from '@/lib/types/database'

const BS_MONTH_NAMES = [
  'Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Aswin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
]

const PM_EMOJI: Record<string, string> = {
  cash: '💵', khata: '📒', esewa: '🟢', khalti: '🟣',
}

/** Convert a BS month/year into the AD ISO date range for querying created_at */
function bsMonthToAdRange(bsYear: number, bsMonth: number): { start: string; end: string } {
  const days    = daysInBSMonth(bsYear, bsMonth)
  const startAD = new NepaliDate(bsYear, bsMonth - 1, 1).toJsDate()
  const endAD   = new NepaliDate(bsYear, bsMonth - 1, days).toJsDate()
  const fmt     = (d: Date) => d.toISOString().split('T')[0]
  return { start: fmt(startAD), end: fmt(endAD) }
}

/** Compact NPR formatter for summary cards */
function formatNPR(n: number): string {
  if (n >= 100000) return `NPR ${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `NPR ${(n / 1000).toFixed(1)}K`
  return `NPR ${n.toLocaleString('ne-NP')}`
}

export default function ReportPage() {
  const todayBs = todayBS()

  const [month,        setMonth]        = useState(todayBs.month)
  const [year,         setYear]         = useState(todayBs.year)
  const [loading,      setLoading]      = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tab,          setTab]          = useState<'income' | 'expense'>('income')

  /** Fetch all transactions for the selected BS month */
  const fetchReport = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: biz } = await supabase
      .from('businesses').select('id').eq('owner_id', user.id).single()
    if (!biz) { setLoading(false); return }

    const { start, end } = bsMonthToAdRange(year, month)
    const startISO = new Date(start + 'T00:00:00').toISOString()
    const endISO   = new Date(end   + 'T23:59:59').toISOString()

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', biz.id)
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false })

    setTransactions((data as Transaction[]) ?? [])
    setLoading(false)
  }, [month, year])

  useEffect(() => { fetchReport() }, [fetchReport])

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const net          = totalIncome - totalExpense
  const incomeCount  = transactions.filter(t => t.type === 'income').length
  const expenseCount = transactions.filter(t => t.type === 'expense').length
  const displayList  = transactions.filter(t => tab === 'income' ? t.type === 'income' : t.type === 'expense')

  /** Export visible month's transactions as CSV */
  function handleExportCSV() {
    const rows = [
      ['PasalSathi Report', `${BS_MONTH_NAMES[month - 1]} ${year} BS`],
      [],
      ['Date', 'Type', 'Item', 'Payment', 'Amount (NPR)'],
      ...transactions.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        t.type,
        t.item_name,
        t.payment_method,
        t.amount,
      ]),
      [],
      ['Total Income',  totalIncome],
      ['Total Expense', totalExpense],
      ['Net',           net],
    ]
    const csv  = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `PasalSathi-${BS_MONTH_NAMES[month - 1]}-${year}.csv`
    a.click()
  }

  const selectClass = 'bg-white/5 border border-white/10 rounded-xl px-3 h-11 text-white outline-none text-sm'

  return (
    <div className="pb-8">
      {/* Sticky header with month/year picker */}
      <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 z-10 px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-white">📊 Reports</h1>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-2 rounded-xl font-semibold text-sm active:scale-95"
            >
              <Download size={16} /> PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-xl font-semibold text-sm active:scale-95"
            >
              <FileSpreadsheet size={16} /> Export
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className={`flex-1 ${selectClass}`}
          >
            {BS_MONTH_NAMES.map((m, i) => (
              <option key={i + 1} value={i + 1} className="bg-[#111]">{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className={`w-28 ${selectClass}`}
          >
            {[todayBs.year - 2, todayBs.year - 1, todayBs.year].map(y => (
              <option key={y} value={y} className="bg-[#111]">{y} BS</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500 text-lg">Loading...</div>
      ) : (
        <div className="px-4 pt-4 space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setTab('income')}
              className={`rounded-2xl p-3.5 border-2 text-center transition-all active:scale-[0.97] ${
                tab === 'income' ? 'bg-green-500/20 border-green-500/50' : 'bg-white/5 border-white/10'
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Income</p>
              <p className="text-sm font-black text-green-400">{formatNPR(totalIncome)}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{incomeCount} entries</p>
            </button>

            <button
              onClick={() => setTab('expense')}
              className={`rounded-2xl p-3.5 border-2 text-center transition-all active:scale-[0.97] ${
                tab === 'expense' ? 'bg-red-500/20 border-red-500/50' : 'bg-white/5 border-white/10'
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Expense</p>
              <p className="text-sm font-black text-red-400">{formatNPR(totalExpense)}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{expenseCount} entries</p>
            </button>

            <div className={`rounded-2xl p-3.5 border-2 text-center ${
              net >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
            }`}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Net</p>
              <p className={`text-sm font-black ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {net >= 0 ? '+' : '-'}{formatNPR(Math.abs(net))}
              </p>
              <p className={`text-[10px] mt-0.5 ${net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {net >= 0 ? 'profit' : 'loss'}
              </p>
            </div>
          </div>

          {/* Income / Expense tab toggle */}
          <div className="flex bg-white/5 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setTab('income')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                tab === 'income' ? 'bg-green-600 text-white' : 'text-gray-500'
              }`}
            >
              <TrendingUp size={15} /> Income
              {incomeCount > 0 && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab === 'income' ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-500'
                }`}>{incomeCount}</span>
              )}
            </button>
            <button
              onClick={() => setTab('expense')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                tab === 'expense' ? 'bg-red-600 text-white' : 'text-gray-500'
              }`}
            >
              <TrendingDown size={15} /> Expense
              {expenseCount > 0 && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab === 'expense' ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-500'
                }`}>{expenseCount}</span>
              )}
            </button>
          </div>

          {/* Transaction list */}
          {displayList.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-5xl mb-3">{tab === 'income' ? '💰' : '💸'}</p>
              <p className="text-gray-500 font-semibold text-base">
                No {tab} in {BS_MONTH_NAMES[month - 1]} {year}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayList.map(tx => (
                <div key={tx.id} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 font-medium">
                          {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-sm">{PM_EMOJI[tx.payment_method] ?? '💳'}</span>
                      </div>
                      <p className="text-sm font-semibold text-white truncate">{tx.item_name}</p>
                    </div>
                    <p className={`text-base font-bold shrink-0 ${
                      tx.type === 'income' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}NPR {Number(tx.amount).toLocaleString('ne-NP')}
                    </p>
                  </div>
                </div>
              ))}

              <div className={`rounded-2xl p-4 border text-center ${
                tab === 'income' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
              }`}>
                <p className="text-xs text-gray-500 mb-1">
                  Total {tab === 'income' ? 'Income' : 'Expense'} — {BS_MONTH_NAMES[month - 1]} {year}
                </p>
                <p className={`text-2xl font-black ${tab === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  NPR {(tab === 'income' ? totalIncome : totalExpense).toLocaleString('ne-NP')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
