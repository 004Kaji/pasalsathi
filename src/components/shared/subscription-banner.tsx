'use client'

import Link from 'next/link'
import type { SubscriptionState } from '@/lib/utils/subscription'

export default function SubscriptionBanner({ status }: { status: SubscriptionState }) {
  if (status.status === 'active') return null

  if (status.status === 'trial') {
    if (status.daysLeft > 7) return null
    return (
      <div className="bg-[#C84B2F]/8 border-b border-[#C84B2F]/20 px-4 py-2 text-center text-sm">
        <span className="text-[#C84B2F]">
          नि:शुल्क परीक्षण: <strong>{status.daysLeft} दिन बाँकी</strong>
        </span>{' '}
        <Link href="/settings/billing" className="text-[#C84B2F] underline font-medium">
          अपग्रेड गर्नुहोस्
        </Link>
      </div>
    )
  }

  if (status.status === 'trial_expired') {
    return (
      <div className="bg-[#C84B2F]/8 border-b border-[#C84B2F]/20 px-4 py-2 text-center text-sm">
        <span className="text-[#C84B2F]">परीक्षण अवधि समाप्त भयो।</span>{' '}
        <Link href="/settings/billing" className="text-[#C84B2F] underline font-medium">
          अहिले नै सदस्यता लिनुहोस्
        </Link>
      </div>
    )
  }

  if (status.status === 'grace') {
    return (
      <div className="bg-[#C9933A]/10 border-b border-[#C9933A]/20 px-4 py-2 text-center text-sm">
        <span className="text-[#C9933A]">
          सदस्यता म्याद सकियो। <strong>{status.daysLeft} दिनको grace period बाँकी।</strong>
        </span>{' '}
        <Link href="/settings/billing" className="text-[#C9933A] underline font-medium">
          नवीकरण गर्नुहोस्
        </Link>
      </div>
    )
  }

  if (status.status === 'expired') {
    return (
      <div className="bg-[#C84B2F] px-4 py-2 text-center text-sm text-white">
        सदस्यता समाप्त भयो।{' '}
        <Link href="/settings/billing" className="underline font-medium">
          नवीकरण गर्नुहोस्
        </Link>
      </div>
    )
  }

  return null
}
