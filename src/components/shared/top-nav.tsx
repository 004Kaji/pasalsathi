'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, ShoppingCart, Users, Package, UserCheck, BarChart2, BarChart3 } from 'lucide-react'

const BASE_ITEMS = [
  { href: '/home',    icon: LayoutDashboard, label: 'Home'    },
  { href: '/sell',    icon: ShoppingCart,    label: 'Sell'    },
  { href: '/khata',   icon: Users,           label: 'Khata'   },
  { href: '/staff',   icon: UserCheck,       label: 'Staff'   },
  { href: '/reports', icon: BarChart2,       label: 'Reports' },
]

const STOCK_ITEM = { href: '/products', icon: Package, label: 'Products' }

export default function TopNav() {
  const pathname = usePathname()
  const [trackStock, setTrackStock] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('ps_track_stock')
    setTrackStock(stored !== '0')
  }, [pathname])

  const NAV_ITEMS = trackStock
    ? [BASE_ITEMS[0], BASE_ITEMS[1], BASE_ITEMS[2], STOCK_ITEM, BASE_ITEMS[3], BASE_ITEMS[4]]
    : BASE_ITEMS

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#F5F0E8]/95 backdrop-blur-xl border-b border-[#D5CFC6]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-[#C84B2F] rounded-xl flex items-center justify-center">
            <BarChart3 size={16} className="text-white" />
          </div>
          <span className="font-bold text-base text-[#1C1917] hidden sm:block">PasalSathi</span>
        </Link>

        {/* Desktop nav links — hidden on mobile (bottom nav handles it) */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/home' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-[#C84B2F]/10 text-[#C84B2F]'
                    : 'text-[#6B6560] hover:bg-[#EDE8DF] hover:text-[#1C1917]'
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right side — mobile: page title placeholder; desktop: nothing needed */}
        <div className="md:hidden">
          {/* spacer to balance logo on mobile */}
          <div className="w-8" />
        </div>
      </div>
    </header>
  )
}
