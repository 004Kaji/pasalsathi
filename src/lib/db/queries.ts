// Cached server-only queries — React cache() deduplicates calls within one render pass.
// Layout + page both calling getAuthUser() costs only ONE network round-trip.
import { cache } from 'react'
import { createServerClient } from './supabase-server'

export const getAuthUser = cache(async () => {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getBusinessByOwner = cache(async (userId: string) => {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', userId)
    .single()
  return data
})
