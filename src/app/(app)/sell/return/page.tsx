'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/supabase'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { formatBSFull } from '@/lib/utils/date'
import type { Transaction } from '@/lib/types/database'

const PM_EMOJI: Record<string, string> = {
  cash: '💵', khata: '📒', esewa: '🟢', khalti: '🟣', fonepay: '📱',
}

export default function ReturnPage() {
  const router = useRouter()
  const [sales,      setSales]      = useState<Transaction[]>([])
  const [loading,    setLoading]    = useState(true)
  const [confirming, setConfirming] = useState<Transaction | null>(null)
  const [done,       setDone]       = useState<string | null>(null)
  const [error,      setError]      = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: biz } = await supabase
        .from('businesses').select('id').eq('owner_id', user.id).single()
      if (!biz) return

      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('business_id', biz.id)
        .eq('type', 'income')
        .order('created_at', { ascending: false })
        .limit(20)

      setSales((data as Transaction[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function confirmRefund(tx: Transaction) {
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: biz } = await supabase
      .from('businesses').select('id').eq('owner_id', user.id).single()
    if (!biz) return

    const { error: err } = await supabase.from('transactions').insert({
      business_id:    biz.id,
      type:           'expense',
      amount:         tx.amount,
      item_name:      `RETURN: ${tx.item_name}`,
      payment_method: tx.payment_method,
      customer_id:    tx.customer_id,
    })

    if (err) { setError(err.message); return }

    setDone(tx.id)
    setConfirming(null)
    setSales(prev => prev.filter(s => s.id !== tx.id))
  }

  function formatTime(iso: string) {
    const d = new Date(iso)
    const bsDate = formatBSFull(d)
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    return `${bsDate}, ${time}`
  }

  return (
    <div className="px-4 pt-6 pb-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-[#EDE8DF] text-[#6B6560] active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#1C1917]">Return / Refund</h1>
          <p className="text-xs text-[#9B948E]">Recent 20 sales — tap to refund</p>
        </div>
      </div>

      {done && (
        <div className="bg-[#4A7055]/10 border border-[#4A7055]/20 rounded-2xl px-4 py-3 mb-4">
          <p className="text-[#4A7055] font-semibold text-sm">✓ Refund recorded successfully</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 mb-4">
          <p className="text-red-500 font-semibold text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <p className="text-center text-[#9B948E] py-10">Loading sales...</p>
      )}

      {!loading && sales.length === 0 && (
        <div className="text-center py-12">
          <p className="text-2xl mb-2">🏪</p>
          <p className="text-[#6B6560] font-medium">No sales to refund</p>
        </div>
      )}

      <div className="space-y-2">
        {sales.map(tx => (
          <div key={tx.id} className="bg-white border border-[#D5CFC6] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1C1917] truncate">{tx.item_name}</p>
                <p className="text-xs text-[#9B948E] mt-0.5">
                  {PM_EMOJI[tx.payment_method] ?? '💳'} {formatTime(tx.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-3 shrink-0">
                <span className="text-base font-bold text-[#4A7055] font-mono">
                  NPR {Number(tx.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <button
                  onClick={() => setConfirming(tx)}
                  className="p-2 rounded-xl bg-red-500/10 text-red-500 active:scale-95 transition-transform"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            {/* Inline confirm */}
            {confirming?.id === tx.id && (
              <div className="border-t border-[#D5CFC6] bg-red-500/5 px-4 py-3 flex items-center justify-between gap-3">
                <p className="text-sm text-red-600 font-medium flex-1">
                  Refund NPR {Number(tx.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirming(null)}
                    className="px-3 py-1.5 rounded-xl border border-[#D5CFC6] text-[#6B6560] text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => confirmRefund(tx)}
                    className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-sm font-bold"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
