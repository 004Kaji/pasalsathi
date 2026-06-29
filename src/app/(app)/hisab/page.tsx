'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/db/supabase'
import {
  TrendingUp, TrendingDown, Plus, Trash2, Pencil,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Transaction } from '@/lib/types/database'
import { formatBSFull } from '@/lib/utils/date'

const PAYMENT_LABELS: Record<string, string> = {
  cash:   'Cash',
  khata:  'Khata',
  esewa:  'eSewa',
  khalti: 'Khalti',
}

function formatNPR(amount: number): string {
  return Number(amount).toLocaleString('ne-NP')
}

function shiftDate(baseDate: string, days: number): string {
  const date = new Date(baseDate + 'T00:00:00')
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

function isoToDisplay(dateStr: string): string {
  return formatBSFull(new Date(dateStr + 'T00:00:00'))
}

export default function HisabPage() {
  const [selectedDate, setSelectedDate]   = useState<string>(new Date().toISOString().split('T')[0])
  const [transactions,  setTransactions]  = useState<Transaction[]>([])
  const [loading,       setLoading]       = useState(true)

  const fetchTransactions = useCallback(async (date: string) => {
    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: business } = await supabase
      .from('businesses').select('id').eq('owner_id', user.id).single()
    if (!business) return

    const dayStart = new Date(date + 'T00:00:00').toISOString()
    const dayEnd   = new Date(date + 'T23:59:59').toISOString()

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', business.id)
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd)
      .order('created_at', { ascending: false })

    setTransactions((data as Transaction[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTransactions(selectedDate) }, [selectedDate, fetchTransactions])

  async function handleDelete(transactionId: string) {
    const supabase = createClient()
    await supabase.from('transactions').delete().eq('id', transactionId)
    setTransactions(prev => prev.filter(t => t.id !== transactionId))
  }

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
  const netAmount    = totalIncome - totalExpense
  const todayDate    = new Date().toISOString().split('T')[0]
  const isToday      = selectedDate === todayDate

  return (
    <div className="pb-6">
      {/* Sticky header with date navigator */}
      <div className="sticky top-0 bg-[#F5F0E8]/90 backdrop-blur-xl border-b border-[#D5CFC6] z-10 px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-[#1C1917]">📒 Ledger</h1>
          <Link
            href="/hisab/new"
            className="flex items-center gap-1.5 bg-[#C84B2F] text-white px-4 py-2.5 rounded-xl font-semibold text-base active:scale-95 transition-transform"
          >
            <Plus size={20} /> Add
          </Link>
        </div>

        <div className="flex items-center justify-between bg-white border border-[#D5CFC6] rounded-xl p-2">
          <button
            onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
            className="p-2 rounded-lg hover:bg-[#EDE8DF] text-[#6B6560] active:scale-95 transition-transform"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="text-center">
            <p className="font-semibold text-[#1C1917] text-base">{isoToDisplay(selectedDate)}</p>
            {isToday && <span className="text-xs text-[#C84B2F] font-medium">Today</span>}
          </div>
          <button
            onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
            disabled={selectedDate >= todayDate}
            className="p-2 rounded-lg hover:bg-[#EDE8DF] text-[#6B6560] active:scale-95 transition-transform disabled:opacity-30"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Summary strip: income / expense / net */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-500/10 rounded-xl p-3 text-center border border-green-500/20">
            <p className="text-xs text-green-600 font-medium">💰 Income</p>
            <p className="text-lg font-bold text-green-700 mt-0.5">NPR {formatNPR(totalIncome)}</p>
          </div>
          <div className="bg-red-500/10 rounded-xl p-3 text-center border border-red-500/20">
            <p className="text-xs text-red-500 font-medium">💸 Expense</p>
            <p className="text-lg font-bold text-red-600 mt-0.5">NPR {formatNPR(totalExpense)}</p>
          </div>
          <div className={`rounded-xl p-3 text-center border ${netAmount >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-[#C84B2F]/10 border-[#C84B2F]/20'}`}>
            <p className={`text-xs font-medium ${netAmount >= 0 ? 'text-blue-500' : 'text-[#C84B2F]'}`}>📊 Net</p>
            <p className={`text-lg font-bold mt-0.5 ${netAmount >= 0 ? 'text-blue-700' : 'text-[#C84B2F]'}`}>
              {netAmount >= 0 ? '+' : ''}{formatNPR(netAmount)}
            </p>
          </div>
        </div>

        {/* Transaction list */}
        {loading ? (
          <div className="text-center py-12 text-[#6B6560] text-lg">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📒</p>
            <p className="text-xl font-semibold text-[#6B6560]">No entries for this day</p>
            <p className="text-base text-[#9B948E] mt-2">Tap &apos;+ Add&apos; above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(transaction => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onDelete={() => handleDelete(transaction.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TransactionCard({
  transaction,
  onDelete,
}: {
  transaction: Transaction
  onDelete: () => void
}) {
  const isIncome     = transaction.type === 'income'
  const paymentLabel = PAYMENT_LABELS[transaction.payment_method] ?? transaction.payment_method

  return (
    <div className={`rounded-2xl border-l-4 bg-white border border-[#D5CFC6] p-4 shadow-sm ${isIncome ? 'border-l-[#4A7055]' : 'border-l-red-500'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`rounded-xl p-2.5 mt-0.5 shrink-0 ${isIncome ? 'bg-[#4A7055]/15 text-[#4A7055]' : 'bg-red-500/15 text-red-500'}`}>
            {isIncome ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-[#1C1917] truncate">
              {transaction.item_name}
            </p>
            <p className="text-xs text-[#9B948E] mt-0.5">{paymentLabel}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <p className={`text-xl font-bold ${isIncome ? 'text-[#4A7055]' : 'text-red-500'}`}>
            {isIncome ? '+' : '-'} NPR {Number(transaction.amount).toLocaleString('ne-NP')}
          </p>
          <div className="flex gap-1">
            <Link
              href={`/hisab/${transaction.id}`}
              className="p-2 rounded-lg bg-[#EDE8DF] text-[#6B6560] hover:bg-blue-500/15 hover:text-blue-600 active:scale-95 transition-all"
            >
              <Pencil size={16} />
            </Link>
            <AlertDialog>
              <AlertDialogTrigger className="p-2 rounded-lg bg-[#EDE8DF] text-[#6B6560] hover:bg-red-500/15 hover:text-red-500 active:scale-95 transition-all">
                <Trash2 size={16} />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl">Delete?</AlertDialogTitle>
                  <AlertDialogDescription className="text-base">
                    This entry will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-base">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700 text-base">
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
