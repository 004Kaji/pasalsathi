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

const CATEGORY_LABELS: Record<TransactionCategory, { label: string; icon: React.ReactNode }> = {
  sales:    { label: 'बिक्री',   icon: <ShoppingBag size={16} /> },
  purchase: { label: 'खरिद',    icon: <ShoppingCart size={16} /> },
  expense:  { label: 'खर्च',    icon: <Wallet size={16} /> },
  salary:   { label: 'तलब',     icon: <User size={16} /> },
  other:    { label: 'अन्य',    icon: <MoreHorizontal size={16} /> },
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'नगद', bank: 'बैंक', esewa: 'eSewa', khalti: 'Khalti',
}

function formatNPR(n: number) {
  return `NPR ${Number(n).toLocaleString('ne-NP')}`
}

function isoToDisplay(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('ne-NP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
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
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-900">हिसाब किताब</h1>
          <Link
            href="/hisab/new"
            className="flex items-center gap-1.5 bg-orange-600 text-white px-4 py-2.5 rounded-xl font-semibold text-base active:scale-95 transition-transform"
          >
            <Plus size={20} /> थप्नुहोस्
          </Link>
        </div>

        {/* Date navigator */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-2">
          <button
            onClick={() => setDate(shiftDate(date, -1))}
            className="p-2 rounded-lg hover:bg-gray-200 active:scale-95 transition-transform"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="text-center">
            <p className="font-semibold text-gray-800 text-base">{isoToDisplay(date)}</p>
            {isToday && <span className="text-xs text-orange-600 font-medium">आज</span>}
          </div>
          <button
            onClick={() => setDate(shiftDate(date, 1))}
            disabled={date >= today}
            className="p-2 rounded-lg hover:bg-gray-200 active:scale-95 transition-transform disabled:opacity-30"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
            <p className="text-xs text-green-600 font-medium">आम्दानी</p>
            <p className="text-lg font-bold text-green-800 mt-0.5">NPR {cashIn.toLocaleString('ne-NP')}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
            <p className="text-xs text-red-600 font-medium">खर्च</p>
            <p className="text-lg font-bold text-red-800 mt-0.5">NPR {cashOut.toLocaleString('ne-NP')}</p>
          </div>
          <div className={`rounded-xl p-3 text-center border ${net >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
            <p className={`text-xs font-medium ${net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>बाँकी</p>
            <p className={`text-lg font-bold mt-0.5 ${net >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
              {net >= 0 ? '+' : ''}{NPR(net)}
            </p>
          </div>
        </div>

        {/* Transaction list */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-lg">लोड हुँदैछ...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📒</p>
            <p className="text-xl font-semibold text-gray-500">यो दिनको हिसाब छैन</p>
            <p className="text-base text-gray-400 mt-2">माथिको "+ थप्नुहोस्" थिच्नुहोस्</p>
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
    <div className={`rounded-2xl border-l-4 bg-white shadow-sm border border-gray-100 p-4 ${isIn ? 'border-l-green-500' : 'border-l-red-500'}`}>
      <div className="flex items-start justify-between gap-2">
        {/* Left side */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`rounded-xl p-2.5 mt-0.5 shrink-0 ${isIn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isIn ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-gray-800 truncate">
              {tx.description || cat.label}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {cat.icon} {cat.label}
              </span>
              <span className="text-xs text-gray-400">{PAYMENT_LABELS[tx.payment_method] ?? tx.payment_method}</span>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <p className={`text-xl font-bold ${isIn ? 'text-green-700' : 'text-red-700'}`}>
            {isIn ? '+' : '-'} NPR {NPR(Number(tx.amount))}
          </p>
          <div className="flex gap-1">
            <Link
              href={`/hisab/${tx.id}`}
              className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 active:scale-95 transition-all"
            >
              <Pencil size={16} />
            </Link>
            <AlertDialog>
              <AlertDialogTrigger className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all">
                <Trash2 size={16} />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl">हटाउने?</AlertDialogTitle>
                  <AlertDialogDescription className="text-base">
                    यो हिसाब हटाइनेछ। यो काम उल्टाउन सकिँदैन।
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-base">रद्द गर्नुहोस्</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-red-600 hover:bg-red-700 text-base"
                  >
                    हटाउनुहोस्
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
