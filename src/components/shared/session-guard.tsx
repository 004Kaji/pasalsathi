'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/db/supabase'

// Runs on every app page. If user logged in without "Remember me",
// signing out when a new browser session is detected (sessionStorage cleared).
export function SessionGuard() {
  useEffect(() => {
    const isNewBrowserSession = !sessionStorage.getItem('ps_active')
    const rememberMe = !!localStorage.getItem('ps_remember_me')

    if (isNewBrowserSession && !rememberMe) {
      // Mark active first so a re-render can't trigger a second sign-out,
      // then hard-redirect to fully reset router state
      sessionStorage.setItem('ps_active', '1')
      createClient().auth.signOut().finally(() => {
        window.location.replace('/login')
      })
    } else {
      sessionStorage.setItem('ps_active', '1')
    }
  }, [])

  return null
}
