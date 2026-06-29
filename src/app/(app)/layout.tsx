import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/db/supabase-server'
import BottomNav from '@/components/shared/bottom-nav'
import SubscriptionBanner from '@/components/shared/subscription-banner'
import OfflineIndicator from '@/components/pwa/offline-indicator'
import InstallPrompt from '@/components/pwa/install-prompt'
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
    // Business should have been auto-created at auth/callback — create fallback here just in case
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const defaultName = (user.email ?? 'My Business').split('@')[0].replace(/[._]/g, ' ')
      await supabase.from('businesses').insert({
        owner_id: user.id,
        name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
      })
    }
    redirect('/home')
  }

  const subStatus = getSubscriptionStatus(business as Business)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <OfflineIndicator />
      <SubscriptionBanner status={subStatus} />
      <main className="flex-1 pb-20 max-w-2xl mx-auto w-full">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <BottomNav />
      <InstallPrompt />
    </div>
  )
}
