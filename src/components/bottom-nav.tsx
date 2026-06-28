'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Users, Package, UserCheck, ShoppingCart, BarChart2 } from 'lucide-react'

const BASE_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home'   },
  { href: '/sell',      icon: ShoppingCart,    label: 'Sell'   },
  { href: '/khata',     icon: Users,           label: 'Khata'  },
  { href: '/staff',     icon: UserCheck,       label: 'Staff'  },
  { href: '/report',    icon: BarChart2,        label: 'Report' },
]

const STOCK_ITEM = { href: '/godam', icon: Package, label: 'Stock' }

export default function BottomNav() {
  const pathname    = usePathname()
  const [trackStock, setTrackStock] = useState(true)

  // Read track_stock from localStorage (written by Settings page on save)
  useEffect(() => {
    const stored = localStorage.getItem('ps_track_stock')
    if (stored === '0') setTrackStock(false)
    else setTrackStock(true)
  }, [pathname]) // re-check on every navigation so changes propagate immediately

  // Insert Stock after Khata when enabled
  const NAV_ITEMS = trackStock
    ? [BASE_ITEMS[0], BASE_ITEMS[1], BASE_ITEMS[2], STOCK_ITEM, BASE_ITEMS[3], BASE_ITEMS[4]]
    : BASE_ITEMS

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#111]/90 backdrop-blur-xl border-t border-white/10 z-50">
      <div className="max-w-2xl mx-auto flex">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
                active ? 'text-orange-400' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
