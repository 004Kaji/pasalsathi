'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { canUseReport } from '@/lib/plan-limits'
import {
  TrendingUp, TrendingDown, Wallet, Download, FileSpreadsheet,
  ShoppingBag, ShoppingCart, Banknote, Truck, Receipt,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { Plan } from '@/types/database'
import { BS_MONTHS } from '@/lib/bs-date'

// AD month → approximate BS month (1-indexed)
const BS_MONTH_NAMES = BS_MONTHS  // ['बैशाख',...,'चैत']
// AD months in Nepali for picker display
const AD_MONTHS_NP = [
  'जनवरी', 'फेब्रुवरी', 'मार्च', 'अप्रिल', 'मे', 'जुन',
  'जुलाई', 'अगस्त', 'सेप्टेम्बर', 'अक्टोबर', 'नोभेम्बर', 'डिसेम्बर',
]

function formatNPR(n: number) {
  if (n >= 100000) return `NPR ${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `NPR ${(n / 1000).toFixed(1)}K`
  return `NPR ${Math.abs(n).toLocaleString('ne-NP')}`
}

function formatFull(n: number) {
  return `NPR ${Math.abs(n).toLocaleString('ne-NP')}`
}

export default function ReportPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [plan, setPlan] = useState<Plan>('sano')
  const [loading, setLoading] = useState(true)

  // Transaction category buckets
  const [salesRevenue, setSalesRevenue] = useState(0)
  const [otherIncome, setOtherIncome] = useState(0)
  const [cogs, setCogs] = useState(0)           // purchase out
  const [opExpenses, setOpExpenses] = useState(0) // expense out
  const [salaryExpense, setSalaryExpense] = useState(0) // salary out
  const [otherExpenses, setOtherExpenses] = useState(0)
  const [staffCost, setStaffCost] = useState(0) // from salary_payments (more accurate)
  const [supplierPaid, setSupplierPaid] = useState(0)

  // Chart + other
  const [catData, setCatData] = useState<{ name: string; आम्दानी: number; खर्च: number }[]>([])
  const [khataStats, setKhataStats] = useState({ totalCredit: 0, totalPaid: 0, customers: 0 })
  const [supplierStats, setSupplierStats] = useState({ total: 0, outstanding: 0, count: 0 })
  const [topProducts, setTopProducts] = useState<{ name: string; qty: number }[]>([])

  const fetchReport = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: biz } = await supabase
      .from('businesses').select('id, plan').eq('owner_id', user.id).single()
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
      { data: supplierEntries },
      { data: suppliers },
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
      supabase.from('supplier_entries').select('type, amount')
        .eq('business_id', biz.id).gte('entry_date', start).lte('entry_date', end),
      supabase.from('suppliers').select('total_credit_taken, total_paid')
        .eq('business_id', biz.id).eq('is_active', true),
    ])

    // Transaction category breakdown
    let salesIn = 0, otherIn = 0, purchaseOut = 0, expenseOut = 0, salaryOut = 0, otherOut = 0
    const catMap: Record<string, { in: number; out: number }> = {}

    ;(txs ?? []).forEach(t => {
      const amt = Number(t.amount)
      if (!catMap[t.category]) catMap[t.category] = { in: 0, out: 0 }
      catMap[t.category][t.type === 'in' ? 'in' : 'out'] += amt

      if (t.type === 'in') {
        if (t.category === 'sales') salesIn += amt
        else otherIn += amt
      } else {
        if (t.category === 'purchase') purchaseOut += amt
        else if (t.category === 'expense') expenseOut += amt
        else if (t.category === 'salary') salaryOut += amt
        else otherOut += amt
      }
    })

    setSalesRevenue(salesIn)
    setOtherIncome(otherIn)
    setCogs(purchaseOut)
    setOpExpenses(expenseOut)
    setSalaryExpense(salaryOut)
    setOtherExpenses(otherOut)
    setCatData(
      Object.entries(catMap).map(([cat, v]) => ({
        name: { sales: 'बिक्री', purchase: 'खरिद', expense: 'खर्च', salary: 'तलब', other: 'अन्य' }[cat] ?? cat,
        आम्दानी: v.in,
        खर्च: v.out,
      }))
    )

    // Staff cost from salary_payments (more accurate than salary transactions)
    const sc = (salPayments ?? []).reduce((s, p) => s + Number(p.payable_amount), 0)
    setStaffCost(sc)

    // Khata stats (all time, not month-filtered)
    const totalCredit = (customers ?? []).reduce((s, c) => s + Number(c.total_credit), 0)
    const totalPaid = (customers ?? []).reduce((s, c) => s + Number(c.total_paid), 0)
    setKhataStats({ totalCredit, totalPaid, customers: customers?.length ?? 0 })

    // Supplier entries this month
    const suppPaid = (supplierEntries ?? [])
      .filter(e => e.type === 'payment_made')
      .reduce((s, e) => s + Number(e.amount), 0)
    setSupplierPaid(suppPaid)

    // Supplier stats (all time)
    const suppTotal = (suppliers ?? []).reduce((s, x) => s + Number(x.total_credit_taken), 0)
    const suppPaidAll = (suppliers ?? []).reduce((s, x) => s + Number(x.total_paid), 0)
    setSupplierStats({
      total: suppTotal,
      outstanding: Math.max(0, suppTotal - suppPaidAll),
      count: suppliers?.length ?? 0,
    })

    // Top products by units out
    const prodMap: Record<string, number> = {}
    ;(stockMovements ?? []).forEach(m => {
      prodMap[m.product_id] = (prodMap[m.product_id] ?? 0) + Number(m.quantity)
    })
    const prodNames = Object.fromEntries((products ?? []).map(p => [p.id, p.name]))
    setTopProducts(
      Object.entries(prodMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([pid, qty]) => ({ name: prodNames[pid] ?? 'अज्ञात', qty }))
    )

    setLoading(false)
  }, [month, year])

  useEffect(() => { fetchReport() }, [fetchReport])

  // P&L waterfall values
  const grossProfit = salesRevenue - cogs
  const totalCost = cogs + opExpenses + (staffCost > 0 ? staffCost : salaryExpense) + otherExpenses
  const trueProfitFromSales = salesRevenue + otherIncome - totalCost
  const collectionRate = khataStats.totalCredit > 0
    ? Math.round((khataStats.totalPaid / khataStats.totalCredit) * 100) : 0

  function handlePrintPDF() { window.print() }
  function handleExportCSV() {
    const rows = [
      ['PasalSathi P&L Report', `${AD_MONTHS_NP[month - 1]} ${year}`],
      [],
      ['बिक्री आम्दानी', salesRevenue],
      ['अन्य आम्दानी', otherIncome],
      ['खरिद लागत (COGS)', -cogs],
      ['= कुल नाफा (Gross Profit)', grossProfit],
      ['सञ्चालन खर्च', -opExpenses],
      ['तलब खर्च', -(staffCost || salaryExpense)],
      ['अन्य खर्च', -otherExpenses],
      ['= खाँटी नाफा (Net Profit)', trueProfitFromSales],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `PasalSathi-PL-${year}-${month}.csv`; a.click()
  }

  const selectClass = "bg-white/5 border border-white/10 rounded-xl px-3 h-11 text-white outline-none focus:ring-2 focus:ring-orange-500/50 text-sm"

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 z-10 px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-white">📊 रिपोर्ट</h1>
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

        {/* Month/Year picker */}
        <div className="flex gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className={`flex-1 ${selectClass}`}>
            {AD_MONTHS_NP.map((m, i) => (
              <option key={i + 1} value={i + 1} className="bg-[#111]">{m}</option>
            ))}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className={`w-28 ${selectClass}`}>
            {[now.getFullYear() - 1, now.getFullYear()].map(y => (
              <option key={y} value={y} className="bg-[#111]">{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500 text-lg">लोड हुँदैछ...</div>
      ) : (
        <div className="px-4 pt-4 space-y-5">

          {/* ─── TRUE PROFIT WATERFALL ─── */}
          <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-white/10">
              <h2 className="text-base font-bold text-white">💹 खाँटी नाफा / नोक्सान</h2>
              <p className="text-xs text-gray-500 mt-0.5">P&L breakdown — {AD_MONTHS_NP[month - 1]} {year}</p>
            </div>

            <div className="px-5 py-4 space-y-2">
              {/* Sales Revenue */}
              <PLRow
                icon={<ShoppingBag size={15} />}
                label="बिक्री आम्दानी"
                value={salesRevenue}
                color="green"
                bold
              />
              {otherIncome > 0 && (
                <PLRow icon={<TrendingUp size={15} />} label="अन्य आम्दानी" value={otherIncome} color="green" />
              )}

              {/* COGS */}
              <div className="border-t border-white/5 pt-2">
                <PLRow
                  icon={<ShoppingCart size={15} />}
                  label="खरिद लागत (COGS)"
                  value={-cogs}
                  color="red"
                />
              </div>

              {/* Gross profit line */}
              <div className={`flex items-center justify-between rounded-xl px-3 py-2.5 mt-1 ${
                grossProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
              }`}>
                <span className={`text-sm font-bold ${grossProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  = कुल नाफा (Gross Profit)
                </span>
                <span className={`text-lg font-bold ${grossProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {grossProfit >= 0 ? '+' : '-'}{formatFull(grossProfit)}
                </span>
              </div>

              {/* Operating expenses */}
              <div className="border-t border-white/5 pt-2 space-y-2">
                {opExpenses > 0 && (
                  <PLRow icon={<Wallet size={15} />} label="सञ्चालन खर्च" value={-opExpenses} color="red" />
                )}
                {(staffCost > 0 || salaryExpense > 0) && (
                  <PLRow
                    icon={<Banknote size={15} />}
                    label="तलब खर्च"
                    value={-(staffCost > 0 ? staffCost : salaryExpense)}
                    color="purple"
                    note={staffCost > 0 ? 'salary slip अनुसार' : undefined}
                  />
                )}
                {supplierPaid > 0 && (
                  <PLRow icon={<Truck size={15} />} label="सप्लायर भुक्तानी" value={-supplierPaid} color="red" />
                )}
                {otherExpenses > 0 && (
                  <PLRow icon={<Receipt size={15} />} label="अन्य खर्च" value={-otherExpenses} color="red" />
                )}
              </div>

              {/* NET PROFIT — big card */}
              <div className={`rounded-2xl p-4 mt-2 border-2 ${
                trueProfitFromSales >= 0
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <p className={`text-sm font-semibold mb-1 ${trueProfitFromSales >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trueProfitFromSales >= 0 ? '🎉 खाँटी नाफा' : '⚠️ खाँटी नोक्सान'}
                </p>
                <p className={`text-5xl font-bold tracking-tight ${trueProfitFromSales >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {trueProfitFromSales >= 0 ? '+' : '-'}
                  {formatFull(trueProfitFromSales)}
                </p>
                {salesRevenue > 0 && (
                  <p className={`text-xs mt-2 ${trueProfitFromSales >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    मार्जिन: {Math.round((trueProfitFromSales / (salesRevenue + otherIncome)) * 100)}%
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick summary tiles */}
          <div className="grid grid-cols-2 gap-3">
            <MiniCard label="कुल आम्दानी" value={salesRevenue + otherIncome} color="green" icon="💰" />
            <MiniCard label="कुल खर्च" value={totalCost} color="red" icon="💸" />
          </div>

          {/* Bar chart */}
          {catData.length > 0 && (
            <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
              <h3 className="text-base font-bold text-white mb-4">📈 वर्गीकरण अनुसार</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={catData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                  <Tooltip
                    formatter={value => [`NPR ${Number(value).toLocaleString('ne-NP')}`, '']}
                    contentStyle={{ fontSize: 13, borderRadius: 8, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 13, color: '#9ca3af' }} />
                  <Bar dataKey="आम्दानी" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="खर्च" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Khata collection */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
            <h3 className="text-base font-bold text-white mb-4">📒 खाता संकलन</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-red-500/10 rounded-xl p-3 text-center">
                <p className="text-xs text-red-400 font-medium">उधारो दिएको</p>
                <p className="text-xl font-bold text-red-300 mt-0.5">{formatNPR(khataStats.totalCredit)}</p>
              </div>
              <div className="bg-green-500/10 rounded-xl p-3 text-center">
                <p className="text-xs text-green-400 font-medium">संकलन भएको</p>
                <p className="text-xl font-bold text-green-300 mt-0.5">{formatNPR(khataStats.totalPaid)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-gray-500">संकलन दर</span>
                <span className={collectionRate >= 80 ? 'text-green-400' : collectionRate >= 50 ? 'text-amber-400' : 'text-red-400'}>
                  {collectionRate}%
                </span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${collectionRate >= 80 ? 'bg-green-500' : collectionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
              <p className="text-xs text-gray-600">
                {formatNPR(khataStats.totalCredit - khataStats.totalPaid)} अझै बाँकी ({khataStats.customers} ग्राहक)
              </p>
            </div>
          </div>

          {/* Supplier outstanding */}
          {supplierStats.count > 0 && (
            <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
              <h3 className="text-base font-bold text-white mb-4">🏭 सप्लायर देनदारी</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-500/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-orange-400 font-medium">कुल लिएको</p>
                  <p className="text-xl font-bold text-orange-300 mt-0.5">{formatNPR(supplierStats.total)}</p>
                </div>
                <div className="bg-red-500/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-red-400 font-medium">तिर्न बाँकी</p>
                  <p className="text-xl font-bold text-red-300 mt-0.5">{formatNPR(supplierStats.outstanding)}</p>
                </div>
              </div>
              {supplierPaid > 0 && (
                <p className="text-xs text-gray-500 mt-3">
                  यो महिना सप्लायरलाई {formatNPR(supplierPaid)} तिरियो
                </p>
              )}
            </div>
          )}

          {/* Top products */}
          {topProducts.length > 0 && (
            <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
              <h3 className="text-base font-bold text-white mb-4">📦 धेरै बिकेका सामान</h3>
              <div className="space-y-3">
                {topProducts.map((p, i) => {
                  const pct = (p.qty / topProducts[0].qty) * 100
                  return (
                    <div key={p.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-white">
                          <span className="text-gray-600 mr-2">#{i + 1}</span>{p.name}
                        </span>
                        <span className="font-bold text-blue-400">{p.qty.toLocaleString('ne-NP')} units</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Plan upsell */}
          {plan === 'sano' && (
            <div className="bg-orange-500/10 border-2 border-orange-500/30 rounded-2xl p-5 text-center">
              <p className="text-orange-300 font-bold text-base">PDF र Excel निर्यात चाहिन्छ?</p>
              <p className="text-orange-500 text-sm mt-1">Madhyam वा Thulo प्लानमा अपग्रेड गर्नुहोस्</p>
              <a href="/settings/billing"
                className="mt-3 block bg-orange-600 text-white py-3 rounded-xl font-semibold text-base active:scale-[0.98] transition-transform">
                अपग्रेड गर्नुहोस् →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PLRow({ icon, label, value, color, bold, note }: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'green' | 'red' | 'purple'
  bold?: boolean
  note?: string
}) {
  const isPos = value >= 0
  const colorMap = {
    green:  { icon: 'text-green-500',  val: 'text-green-400' },
    red:    { icon: 'text-red-500',    val: 'text-red-400' },
    purple: { icon: 'text-purple-500', val: 'text-purple-400' },
  }
  const c = colorMap[color]
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <span className={c.icon}>{icon}</span>
        <div>
          <span className={`text-sm ${bold ? 'font-bold text-white' : 'text-gray-400'}`}>{label}</span>
          {note && <p className="text-[10px] text-gray-600">{note}</p>}
        </div>
      </div>
      <span className={`text-sm ${bold ? 'font-bold' : 'font-semibold'} ${isPos ? 'text-green-400' : c.val}`}>
        {value >= 0 ? '+' : '-'}{formatFull(value)}
      </span>
    </div>
  )
}

function MiniCard({ label, value, color, icon }: {
  label: string; value: number; color: 'green' | 'red'; icon: string
}) {
  const bg = color === 'green' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
  const text = color === 'green' ? 'text-green-400' : 'text-red-400'
  const val = color === 'green' ? 'text-green-300' : 'text-red-300'
  return (
    <div className={`${bg} border rounded-2xl p-4`}>
      <p className={`text-xs font-medium ${text}`}>{icon} {label}</p>
      <p className={`text-xl font-bold ${val} mt-1`}>{formatNPR(value)}</p>
    </div>
  )
}
