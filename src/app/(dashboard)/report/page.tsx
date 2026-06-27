'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { canUseReport } from '@/lib/plan-limits'
import { TrendingUp, TrendingDown, Wallet, Download, FileSpreadsheet } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Plan } from '@/types/database'

const MONTH_NAMES_NP = ['जनवरी','फेब्रुवरी','मार्च','अप्रिल','मे','जुन','जुलाई','अगस्त','सेप्टेम्बर','अक्टोबर','नोभेम्बर','डिसेम्बर']
const CAT_LABELS: Record<string, string> = {
  sales: 'बिक्री', purchase: 'खरिद', expense: 'खर्च', salary: 'तलब', other: 'अन्य',
}

function formatNPR(n: number) {
  if (n >= 100000) return `NPR ${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `NPR ${(n / 1000).toFixed(0)}K`
  return `NPR ${n.toLocaleString('ne-NP')}`
}

export default function ReportPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [plan, setPlan] = useState<Plan>('sano')
  const [loading, setLoading] = useState(true)

  // Report data
  const [totalIn, setTotalIn] = useState(0)
  const [totalOut, setTotalOut] = useState(0)
  const [catData, setCatData] = useState<{ name: string; आम्दानी: number; खर्च: number }[]>([])
  const [khataStats, setKhataStats] = useState({ totalCredit: 0, totalPaid: 0, customers: 0 })
  const [topProducts, setTopProducts] = useState<{ name: string; qty: number }[]>([])
  const [staffCost, setStaffCost] = useState(0)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: biz } = await supabase.from('businesses').select('id, plan').eq('owner_id', user.id).single()
    if (!biz) return
    setPlan(biz.plan as Plan)

    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

    const [
      { data: txs },
      { data: customers },
      { data: stockMovements },
      { data: products },
      { data: salPayments },
    ] = await Promise.all([
      supabase.from('transactions').select('type, amount, category')
        .eq('business_id', biz.id).gte('transaction_date', start).lte('transaction_date', end),
      supabase.from('customers').select('total_credit, total_paid').eq('business_id', biz.id),
      supabase.from('stock_movements').select('product_id, quantity, type')
        .eq('business_id', biz.id).eq('type', 'out')
        .gte('movement_date', start).lte('movement_date', end),
      supabase.from('products').select('id, name').eq('business_id', biz.id),
      supabase.from('salary_payments').select('payable_amount')
        .eq('business_id', biz.id).eq('month', month).eq('year', year),
    ])

    // Transaction totals
    let totalInVal = 0, totalOutVal = 0
    const catMap: Record<string, { in: number; out: number }> = {}
    ;(txs ?? []).forEach((t) => {
      const amt = Number(t.amount)
      if (t.type === 'in') totalInVal += amt
      else totalOutVal += amt
      if (!catMap[t.category]) catMap[t.category] = { in: 0, out: 0 }
      catMap[t.category][t.type === 'in' ? 'in' : 'out'] += amt
    })

    setTotalIn(totalInVal)
    setTotalOut(totalOutVal)
    setCatData(
      Object.entries(catMap).map(([cat, vals]) => ({
        name: CAT_LABELS[cat] ?? cat,
        आम्दानी: vals.in,
        खर्च: vals.out,
      }))
    )

    // Khata stats
    const totalCredit = (customers ?? []).reduce((s, c) => s + Number(c.total_credit), 0)
    const totalPaid = (customers ?? []).reduce((s, c) => s + Number(c.total_paid), 0)
    setKhataStats({ totalCredit, totalPaid, customers: customers?.length ?? 0 })

    // Top products
    const prodMap: Record<string, number> = {}
    ;(stockMovements ?? []).forEach((m) => {
      prodMap[m.product_id] = (prodMap[m.product_id] ?? 0) + Number(m.quantity)
    })
    const prodNames = Object.fromEntries((products ?? []).map((p) => [p.id, p.name]))
    const sorted = Object.entries(prodMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pid, qty]) => ({ name: prodNames[pid] ?? 'अज्ञात', qty }))
    setTopProducts(sorted)

    // Staff cost
    const cost = (salPayments ?? []).reduce((s, p) => s + Number(p.payable_amount), 0)
    setStaffCost(cost)

    setLoading(false)
  }, [month, year])

  useEffect(() => { fetchReport() }, [fetchReport])

  const net = totalIn - totalOut
  const collectionRate = khataStats.totalCredit > 0
    ? Math.round((khataStats.totalPaid / khataStats.totalCredit) * 100)
    : 0

  function handlePrintPDF() { window.print() }

  function handleExportCSV() {
    const rows = [
      ['MeroHisab Report', `${MONTH_NAMES_NP[month - 1]} ${year}`],
      [],
      ['विवरण', 'रकम (NPR)'],
      ['कुल आम्दानी', totalIn],
      ['कुल खर्च', totalOut],
      ['नाफा / नोक्सान', net],
      ['स्टाफ खर्च', staffCost],
      [],
      ['खाता', ''],
      ['कुल उधारो', khataStats.totalCredit],
      ['कुल संकलन', khataStats.totalPaid],
      ['बाँकी', khataStats.totalCredit - khataStats.totalPaid],
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `MeroHisab-${year}-${month}.csv`
    a.click()
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-900">रिपोर्ट</h1>
          <div className="flex gap-2">
            {canUseReport(plan, 'pdf') && (
              <button onClick={handlePrintPDF}
                className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-2 rounded-xl font-semibold text-sm active:scale-95">
                <Download size={16} /> PDF
              </button>
            )}
            {canUseReport(plan, 'excel') && (
              <button onClick={handleExportCSV}
                className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-xl font-semibold text-sm active:scale-95">
                <FileSpreadsheet size={16} /> Excel
              </button>
            )}
          </div>
        </div>

        {/* Month picker */}
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="flex-1 text-base border border-gray-200 rounded-xl px-3 h-11 outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          >
            {MONTH_NAMES_NP.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-28 text-base border border-gray-200 rounded-xl px-3 h-11 outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          >
            {[now.getFullYear() - 1, now.getFullYear()].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-lg">लोड हुँदैछ...</div>
      ) : (
        <div className="px-4 pt-4 space-y-5">

          {/* Summary cards */}
          <div className="space-y-3">
            <SummaryCard icon={<TrendingUp size={24} />} label="कुल आम्दानी" value={totalIn} color="green" />
            <SummaryCard icon={<TrendingDown size={24} />} label="कुल खर्च" value={totalOut} color="red" />
            <div className={`rounded-2xl p-5 border-2 ${net >= 0 ? 'bg-blue-50 border-blue-300' : 'bg-orange-50 border-orange-300'}`}>
              <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 ${net >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                  <Wallet size={24} className={net >= 0 ? 'text-blue-600' : 'text-orange-600'} />
                </div>
                <div>
                  <p className={`text-base font-semibold ${net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                    {net >= 0 ? 'नाफा 🎉' : 'नोक्सान ⚠️'}
                  </p>
                  <p className={`text-3xl font-bold ${net >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                    {net >= 0 ? '+' : ''} NPR {Math.abs(net).toLocaleString('ne-NP')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bar chart */}
          {catData.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 mb-4">वर्गीकरण अनुसार</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={catData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                  <Tooltip
                    formatter={(value) => [`NPR ${Number(value).toLocaleString('ne-NP')}`, '']}
                    contentStyle={{ fontSize: 13, borderRadius: 8 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Bar dataKey="आम्दानी" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="खर्च" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Khata stats */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-4">खाता संकलन</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-xs text-red-600 font-medium">कुल उधारो दिएको</p>
                <p className="text-xl font-bold text-red-800 mt-0.5">NPR {khataStats.totalCredit.toLocaleString('ne-NP')}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-xs text-green-600 font-medium">कुल संकलन भएको</p>
                <p className="text-xl font-bold text-green-800 mt-0.5">NPR {khataStats.totalPaid.toLocaleString('ne-NP')}</p>
              </div>
            </div>
            {/* Collection rate bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-gray-600">संकलन दर</span>
                <span className={collectionRate >= 80 ? 'text-green-600' : collectionRate >= 50 ? 'text-amber-600' : 'text-red-600'}>
                  {collectionRate}%
                </span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${collectionRate >= 80 ? 'bg-green-500' : collectionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">
                NPR {(khataStats.totalCredit - khataStats.totalPaid).toLocaleString('ne-NP')} अझै बाँकी छ ({khataStats.customers} ग्राहक)
              </p>
            </div>
          </div>

          {/* Top products */}
          {topProducts.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 mb-4">धेरै बिकेका सामान</h3>
              <div className="space-y-3">
                {topProducts.map((p, i) => {
                  const maxQty = topProducts[0].qty
                  return (
                    <div key={p.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-800">
                          <span className="text-gray-400 mr-2">#{i + 1}</span>{p.name}
                        </span>
                        <span className="font-bold text-blue-700">{p.qty.toLocaleString('ne-NP')} units</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(p.qty / maxQty) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Staff cost */}
          {staffCost > 0 && (
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-purple-600">यो महिनाको तलब खर्च</p>
                  <p className="text-2xl font-bold text-purple-900 mt-0.5">
                    NPR {staffCost.toLocaleString('ne-NP')}
                  </p>
                </div>
                {totalIn > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">आम्दानीको</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {Math.round((staffCost / totalIn) * 100)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Plan upsell for basic */}
          {plan === 'sano' && (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-5 text-center">
              <p className="text-orange-800 font-bold text-base">PDF र Excel निर्यात चाहिन्छ?</p>
              <p className="text-orange-600 text-sm mt-1">Madhyam वा Thulo प्लानमा अपग्रेड गर्नुहोस्</p>
              <a href="/settings/billing" className="mt-3 block bg-orange-600 text-white py-3 rounded-xl font-semibold text-base active:scale-[0.98] transition-transform">
                अपग्रेड गर्नुहोस् →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SummaryCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: 'green' | 'red'
}) {
  const styles = {
    green: { bg: 'bg-green-50', border: 'border-green-200', iconBg: 'bg-green-100 text-green-600', text: 'text-green-900', label: 'text-green-700' },
    red:   { bg: 'bg-red-50',   border: 'border-red-200',   iconBg: 'bg-red-100 text-red-600',     text: 'text-red-900',   label: 'text-red-700' },
  }
  const s = styles[color]
  return (
    <div className={`${s.bg} border ${s.border} rounded-2xl p-5 flex items-center gap-4`}>
      <div className={`rounded-xl p-3 ${s.iconBg}`}>{icon}</div>
      <div>
        <p className={`text-base font-semibold ${s.label}`}>{label}</p>
        <p className={`text-3xl font-bold mt-0.5 ${s.text}`}>NPR {value.toLocaleString('ne-NP')}</p>
      </div>
    </div>
  )
}
