'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/supabase'
import { ArrowLeft, Users, Info } from 'lucide-react'

export default function UsersPage() {
  const router = useRouter()
  const [ownerEmail, setOwnerEmail] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setOwnerEmail(user.email)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-10">
      <div className="bg-blue-600 px-4 pt-5 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/20 text-white active:scale-95 transition-transform">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">Team Members</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
          <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            Multi-user / staff login is coming soon. For now, share your login credentials with trusted staff.
          </p>
        </div>

        {ownerEmail && (
          <div className="bg-white border border-[#D5CFC6] rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="bg-blue-500/15 rounded-full w-11 h-11 flex items-center justify-center shrink-0">
                <Users size={20} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-[#1C1917] truncate font-mono">{ownerEmail}</p>
                <p className="text-sm text-[#6B6560]">Owner</p>
              </div>
              <span className="text-xs bg-[#C84B2F]/10 text-[#C84B2F] font-semibold px-2.5 py-1 rounded-full">
                Owner
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
