import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/db/supabase-server'
import { todayBS } from '@/lib/utils/date'

const BS_MONTHS_EN = [
  'Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Aswin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
]

export default async function HomePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('name')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/home')

  const bs = todayBS()
  const bsDate = `${BS_MONTHS_EN[bs.month - 1]} ${bs.date}, ${bs.year}`

  return (
    <div className="px-4 pt-6 space-y-5">

      {/* Header */}
      <div>
        <p className="text-xs text-[#9B948E] font-medium">📅 {bsDate}</p>
        <h1 className="text-3xl font-bold text-[#1C1917] mt-1 font-display">{business.name}</h1>
      </div>

    </div>
  )
}
