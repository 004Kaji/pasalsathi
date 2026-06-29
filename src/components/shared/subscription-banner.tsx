'use client'

import Link from 'next/link'
import type { SubscriptionState } from '@/lib/utils/subscription'

export default function SubscriptionBanner({ status }: { status: SubscriptionState }) {
  if (status.status === 'active') return null

  if (status.status === 'trial') {
    if (status.daysLeft > 7) return null
    return (
      <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 text-center text-sm">
        <span className="text-orange-700">
          नि:शुल्क परीक्षण: <strong>{status.daysLeft} दिन बाँकी</strong>
        </span>{' '}
        <Link href="/settings/billing" className="text-orange-600 underline font-medium">
          अपग्रेड गर्नुहोस्
        </Link>
      </div>
    )
  }

  if (status.status === 'trial_expired') {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-center text-sm">
        <span className="text-red-700">परीक्षण अवधि समाप्त भयो।</span>{' '}
        <Link href="/settings/billing" className="text-red-600 underline font-medium">
          अहिले नै सदस्यता लिनुहोस्
        </Link>
      </div>
    )
  }

  if (status.status === 'grace') {
    return (
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center text-sm">
        <span className="text-yellow-700">
          सदस्यता म्याद सकियो। <strong>{status.daysLeft} दिनको grace period बाँकी।</strong>
        </span>{' '}
        <Link href="/settings/billing" className="text-yellow-700 underline font-medium">
          नवीकरण गर्नुहोस्
        </Link>
      </div>
    )
  }

  if (status.status === 'expired') {
    return (
      <div className="bg-red-600 px-4 py-2 text-center text-sm text-white">
        सदस्यता समाप्त भयो।{' '}
        <Link href="/settings/billing" className="underline font-medium">
          नवीकरण गर्नुहोस्
        </Link>
      </div>
    )
  }

  return null
}
