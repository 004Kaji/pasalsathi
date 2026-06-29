import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/db/supabase-server'
import BottomNav from '@/components/shared/bottom-nav'
import TopNav from '@/components/shared/top-nav'
import SubscriptionBanner from '@/components/shared/subscription-banner'
import OfflineIndicator from '@/components/pwa/offline-indicator'
import InstallPrompt from '@/components/pwa/install-prompt'
import ReferralClaimer from '@/components/shared/referral-claimer'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { getSubscriptionStatus } from '@/lib/utils/subscription'
import type { Business } from '@/lib/types/database'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!business) {
    const defaultName = (user.email ?? 'My Business').split('@')[0].replace(/[._]/g, ' ')
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const refCode = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    await supabase.from('businesses').insert({
      owner_id:      user.id,
      name:          defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
      referral_code: refCode,
    })
    redirect('/home')
  }

  const subStatus = getSubscriptionStatus(business as Business)

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C1917] flex flex-col">
      <TopNav />
      <OfflineIndicator />
      <SubscriptionBanner status={subStatus} />
      {/* pt-14 clears fixed TopNav; pb-24 clears BottomNav on mobile, removed on desktop */}
      <main className="flex-1 pt-14 pb-24 md:pb-6 max-w-2xl md:max-w-5xl mx-auto w-full">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      {/* BottomNav visible only on mobile; desktop uses TopNav */}
      <div className="md:hidden">
        <BottomNav />
      </div>
      <InstallPrompt />
      <ReferralClaimer />
    </div>
  )
}
