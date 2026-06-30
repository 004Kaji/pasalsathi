'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/db/supabase'
import { Plus, Search, ChevronRight, Users } from 'lucide-react'
import { PageSkeleton } from '@/components/ui/skeleton'
import type { Customer } from '@/lib/types/database'

export default function KhataPage() {
  const [customers,  setCustomers]  = useState<Customer[]>([])
  const [search,     setSearch]     = useState('')
  const [loading,    setLoading]    = useState(true)
  const [bizName,    setBizName]    = useState('')

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: biz } = await supabase
      .from('businesses').select('id, name').eq('owner_id', user.id).single()
    if (!biz) return
    setBizName((biz as { id: string; name: string }).name ?? 'PasalSathi')

    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false })

    setCustomers((data as Customer[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search)
  )

  const totalOutstanding = customers.reduce(
    (sum, c) => sum + Math.max(0, Number(c.balance)), 0
  )

  function sendWhatsApp(customer: Customer) {
    const amt = Number(customer.balance).toLocaleString('en-IN', { maximumFractionDigits: 0 })
    const msg = `नमस्ते ${customer.name} जी, तपाईंको NPR ${amt} उधारो बाँकी छ। कृपया भुक्तानी गर्नुहोस्। - ${bizName}`
    const phone = (customer.phone ?? '').replace(/^\+?977/, '').replace(/\D/g, '')
    window.open(`https://wa.me/977${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-24">

      {/* Sticky header */}
      <div className="sticky top-0 bg-[#F5F0E8]/90 backdrop-blur-xl border-b border-[#D5CFC6] z-20 px-4 pt-5 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1C1917]">📒 Khata Book</h1>
          <Link
            href="/khata/new"
            className="flex items-center gap-1.5 bg-[#C84B2F] text-white px-4 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
          >
            <Plus size={18} /> New
          </Link>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B948E]" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 bg-white border border-[#D5CFC6] rounded-xl text-sm text-[#1C1917] placeholder:text-[#9B948E] outline-none focus:border-[#C84B2F]/50"
          />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {loading ? (
          <PageSkeleton rows={5} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📒</p>
            <p className="text-xl font-semibold text-[#6B6560]">
              {search ? 'No one found' : 'No customers yet'}
            </p>
            {!search && (
              <Link href="/khata/new" className="mt-4 inline-block px-5 py-3 bg-[#C84B2F] text-white rounded-xl font-semibold text-sm">
                + Add Customer
              </Link>
            )}
          </div>
        ) : (
          <>
            {filtered.map(customer => {
              const outstanding = Math.max(0, Number(customer.balance))
              const isClear     = outstanding === 0

              return (
                <div key={customer.id} className="bg-white border border-[#D5CFC6] rounded-2xl overflow-hidden shadow-sm">
                  <Link href={`/khata/${customer.id}`} className="flex items-center justify-between px-4 py-4 active:bg-[#F5F0E8]">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-[#1C1917] truncate">{customer.name}</p>
                      {customer.phone && (
                        <p className="text-xs text-[#9B948E] mt-0.5">📱 {customer.phone}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <div className="text-right">
                        <p className={`text-base font-bold ${isClear ? 'text-[#4A7055]' : 'text-red-500'}`}>
                          NPR {outstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-[#9B948E]">{isClear ? '🟢 Clear' : '🔴 Due'}</p>
                      </div>
                      <ChevronRight size={16} className="text-[#9B948E]" />
                    </div>
                  </Link>

                  {customer.phone && outstanding > 0 && (
                    <div className="border-t border-[#E0D9CE] px-4 py-2.5">
                      <button
                        onClick={() => sendWhatsApp(customer)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-semibold active:scale-[0.98] transition-transform"
                      >
                        <span className="text-sm">💬</span> WhatsApp Reminder
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Total outstanding */}
            <div className="mt-2 bg-[#C84B2F]/8 border border-[#C84B2F]/20 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#C84B2F]/10 rounded-xl">
                  <Users size={20} className="text-[#C84B2F]" />
                </div>
                <p className="text-sm font-semibold text-[#6B6560]">Total Owed</p>
              </div>
              <p className="text-xl font-bold text-[#C84B2F]">
                NPR {totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
