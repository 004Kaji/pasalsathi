// Browser (client component) Supabase client — safe to import in 'use client' files
import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseDirectClient } from '@supabase/supabase-js'

/** Browser client for 'use client' components */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/** Service-role client — server only, bypasses all RLS */
export function createAdminClient() {
  return createSupabaseDirectClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
