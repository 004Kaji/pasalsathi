'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp, TrendingDown, Plus, Trash2, Pencil,
  ShoppingCart, ShoppingBag, Wallet, User, MoreHorizontal, ChevronLeft, ChevronRight
} from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Transaction, TransactionCategory } from '@/types/database'
import { formatBSFull } from '@/lib/bs-date'

const CATEGORY_LABELS: Record<TransactionCategory, { label: string; icon: React.ReactNode }> = {
  sales:    { label: 'Sales',    icon: <ShoppingBag size={16} /> },
  purchase: { label: 'Purchase', icon: <ShoppingCart size={16} /> },
  expense:  { label: 'Expense',  icon: <Wallet size={16} /> },
  salary:   { label: 'Salary',   icon: <User size={16} /> },
  other:    { label: 'Other',    icon: <MoreHorizontal size={16} /> },
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash', bank: 'Bank', esewa: 'eSewa', khalti: 'Khalti',
}

function formatNPR(n: number) {
  return `NPR ${Number(n).toLocaleString('ne-NP')}`
}

function isoToDisplay(dateStr: string) {
  return formatBSFull(new Date(dateStr + 'T00:00:00'))
}

function shiftDate(base: string, days: number): string {
  const d = new Date(base + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export default function HisabPage() {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string>('')

  const fetchTransactions = useCallback(async (d: string) => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: biz } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!biz) return
    setBusinessId(biz.id)

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', biz.id)
      .eq('transaction_date', d)
      .order('created_at', { ascending: false })

    setTransactions((data as Transaction[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTransactions(date) }, [date, fetchTransactions])

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const cashIn = transactions.filter((t) => t.type === 'in').reduce((s, t) => s + Number(t.amount), 0)
  const cashOut = transactions.filter((t) => t.type === 'out').reduce((s, t) => s + Number(t.amount), 0)
  const net = cashIn - cashOut
  const today = new Date().toISOString().split('T')[0]
  const isToday = date === today

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 z-10 px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-white">📒 Ledger</h1>
          <Link
            href="/hisab/new"
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white px-4 py-2.5 rounded-xl font-semibold text-base active:scale-95 transition-transform"
          >
            <Plus size={20} /> Add
          </Link>
        </div>

        {/* Date navigator */}
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-2">
          <button
            onClick={() => setDate(shiftDate(date, -1))}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 active:scale-95 transition-transform"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="text-center">
            <p className="font-semibold text-white text-base">{isoToDisplay(date)}</p>
            {isToday && <span className="text-xs text-orange-400 font-medium">Today</span>}
          </div>
          <button
            onClick={() => setDate(shiftDate(date, 1))}
            disabled={date >= today}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 active:scale-95 transition-transform disabled:opacity-30"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-500/10 rounded-xl p-3 text-center border border-green-500/20">
            <p className="text-xs text-green-400 font-medium">💰 Income</p>
            <p className="text-lg font-bold text-green-300 mt-0.5">NPR {cashIn.toLocaleString('ne-NP')}</p>
          </div>
          <div className="bg-red-500/10 rounded-xl p-3 text-center border border-red-500/20">
            <p className="text-xs text-red-400 font-medium">💸 Expense</p>
            <p className="text-lg font-bold text-red-300 mt-0.5">NPR {cashOut.toLocaleString('ne-NP')}</p>
          </div>
          <div className={`rounded-xl p-3 text-center border ${net >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
            <p className={`text-xs font-medium ${net >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>📊 Net</p>
            <p className={`text-lg font-bold mt-0.5 ${net >= 0 ? 'text-blue-300' : 'text-orange-300'}`}>
              {net >= 0 ? '+' : ''}{NPR(net)}
            </p>
          </div>
        </div>

        {/* Transaction list */}
        {loading ? (
          <div className="text-center py-12 text-gray-500 text-lg">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📒</p>
            <p className="text-xl font-semibold text-gray-500">No entries for this day</p>
            <p className="text-base text-gray-600 mt-2">Tap '+ Add' above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <TransactionCard
                key={tx.id}
                tx={tx}
                onDelete={() => handleDelete(tx.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function NPR(n: number) {
  return Number(n).toLocaleString('ne-NP')
}

function TransactionCard({ tx, onDelete }: { tx: Transaction; onDelete: () => void }) {
  const isIn = tx.type === 'in'
  const cat = CATEGORY_LABELS[tx.category]

  return (
    <div className={`rounded-2xl border-l-4 bg-white/5 border border-white/10 p-4 ${isIn ? 'border-l-green-500' : 'border-l-red-500'}`}>
      <div className="flex items-start justify-between gap-2">
        {/* Left side */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`rounded-xl p-2.5 mt-0.5 shrink-0 ${isIn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {isIn ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-white truncate">
              {tx.description || cat.label}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                {cat.icon} {cat.label}
              </span>
              <span className="text-xs text-gray-600">{PAYMENT_LABELS[tx.payment_method] ?? tx.payment_method}</span>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <p className={`text-xl font-bold ${isIn ? 'text-green-400' : 'text-red-400'}`}>
            {isIn ? '+' : '-'} NPR {NPR(Number(tx.amount))}
          </p>
          <div className="flex gap-1">
            <Link
              href={`/hisab/${tx.id}`}
              className="p-2 rounded-lg bg-white/10 text-gray-500 hover:bg-blue-500/20 hover:text-blue-400 active:scale-95 transition-all"
            >
              <Pencil size={16} />
            </Link>
            <AlertDialog>
              <AlertDialogTrigger className="p-2 rounded-lg bg-white/10 text-gray-500 hover:bg-red-500/20 hover:text-red-400 active:scale-95 transition-all">
                <Trash2 size={16} />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl">Delete?</AlertDialogTitle>
                  <AlertDialogDescription className="text-base">
                    This entry will be deleted. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-base">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-red-600 hover:bg-red-700 text-base"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  )
}
