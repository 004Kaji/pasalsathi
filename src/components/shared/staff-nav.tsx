'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Users, LogOut } from 'lucide-react'
import { getStaffName } from '@/lib/staff-mode'

// Bottom nav for staff mode — Sell and Khata only. No Reports (profit),
// no Settings, no Products (cost prices).
export default function StaffNav() {
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/staff/logout', { method: 'POST' })
    window.location.href = '/staff-login'
  }

  const item = (active: boolean) =>
    `flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
      active ? 'text-[#C84B2F]' : 'text-[#9B948E]'
    }`

  return (
    <>
      {/* Top bar: who is logged in */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-[#1C1917] text-white px-4 h-11 flex items-center justify-between">
        <span className="text-sm font-semibold">🏪 Staff: {getStaffName() ?? ''}</span>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-white/60 active:scale-95">
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#D5CFC6] flex">
        <Link href="/sell" className={item(pathname.startsWith('/sell'))}>
          <ShoppingCart size={20} /> Sell
        </Link>
        <Link href="/khata" className={item(pathname.startsWith('/khata'))}>
          <Users size={20} /> Khata
        </Link>
      </nav>
    </>
  )
}
