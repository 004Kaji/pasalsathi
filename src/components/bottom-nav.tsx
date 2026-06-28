'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, Users, Package, UserCheck, ShoppingCart } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/sell',      icon: ShoppingCart,    label: 'Sell' },
  { href: '/hisab',    icon: BookOpen,         label: 'Ledger' },
  { href: '/khata',    icon: Users,            label: 'Khata' },
  { href: '/godam',    icon: Package,          label: 'Stock' },
  { href: '/staff',    icon: UserCheck,        label: 'Staff' },
]

export default function BottomNav() {
  const pathname = usePathname()

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
