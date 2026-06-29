'use client'
// Authentication hook — provides current user and business from Supabase session
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/db/supabase'
import type { Business } from '@/lib/types/database'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  business: Business | null
  loading: boolean
}

/** Returns the current user and their business. Re-fetches on auth state change. */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, business: null, loading: true })

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setState({ user: null, business: null, loading: false })
        return
      }

      const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      setState({ user, business: business as Business | null, loading: false })
    }

    load()

    // Re-run whenever the session changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { load() })
    return () => subscription.unsubscribe()
  }, [])

  return state
}
