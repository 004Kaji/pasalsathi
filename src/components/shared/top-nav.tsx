'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BarChart3, Settings } from 'lucide-react'

const BASE_ITEMS = [
  { href: '/home',     label: 'Home'     },
  { href: '/sell',     label: 'Sell'     },
  { href: '/khata',    label: 'Khata'    },
  { href: '/staff',    label: 'Staff'    },
  { href: '/reports',  label: 'Reports'  },
  { href: '/settings', label: 'Settings' },
]

const STOCK_ITEM = { href: '/products', label: 'Products' }

export default function TopNav() {
  const pathname   = usePathname()
  const [trackStock, setTrackStock] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('ps_track_stock')
    setTrackStock(stored !== '0')
  }, [pathname])

  const NAV_ITEMS = trackStock
    ? [BASE_ITEMS[0], BASE_ITEMS[1], BASE_ITEMS[2], STOCK_ITEM, BASE_ITEMS[3], BASE_ITEMS[4], BASE_ITEMS[5]]
    : BASE_ITEMS

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1C1917]">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">

        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="w-7 h-7 bg-[#C84B2F] rounded-lg flex items-center justify-center">
            <BarChart3 size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm text-white hidden sm:block">PasalSathi</span>
        </Link>

        {/* Desktop nav — hidden on mobile (bottom nav handles it) */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = pathname === href || (href !== '/home' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/55 hover:text-white/90 hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Mobile: spacer + settings icon */}
        <div className="flex-1 md:hidden" />
        <Link
          href="/settings"
          className={`md:hidden p-2 rounded-lg transition-colors ${
            pathname.startsWith('/settings') ? 'text-white' : 'text-white/55'
          }`}
        >
          <Settings size={20} />
        </Link>
      </div>
    </header>
  )
}
