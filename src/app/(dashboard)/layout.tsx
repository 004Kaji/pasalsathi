import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/bottom-nav'
import SubscriptionBanner from '@/components/subscription-banner'
import { getSubscriptionStatus } from '@/lib/subscription'
import type { Business } from '@/types/database'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/onboarding')

  const subStatus = getSubscriptionStatus(business as Business)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SubscriptionBanner status={subStatus} />
      <main className="flex-1 pb-20 max-w-2xl mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
