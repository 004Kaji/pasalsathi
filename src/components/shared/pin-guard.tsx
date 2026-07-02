'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/supabase'
import { PinLockScreen } from './pin-lock-screen'

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'click'] as const

export function PinGuard() {
  const router  = useRouter()
  const [locked, setLocked] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getPinHash    = () => (typeof window !== 'undefined' ? localStorage.getItem('ps_pin_hash') : null)
  const getTimeoutSec = () => parseInt(typeof window !== 'undefined' ? (localStorage.getItem('ps_pin_timeout') ?? '900') : '900')

  const lock = useCallback(() => {
    if (!getPinHash()) return
    setLocked(true)
    sessionStorage.setItem('ps_locked', '1')
  }, [])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    localStorage.setItem('ps_last_activity', Date.now().toString())
    timerRef.current = setTimeout(lock, getTimeoutSec() * 1000)
  }, [lock])

  useEffect(() => {
    if (!getPinHash()) return

    // Already locked (e.g. page refresh while locked)
    if (sessionStorage.getItem('ps_locked') === '1') {
      setLocked(true)
      return
    }

    // Was inactive while tab was closed/hidden
    const lastActive = parseInt(localStorage.getItem('ps_last_activity') ?? String(Date.now()))
    if (Date.now() - lastActive > getTimeoutSec() * 1000) {
      lock()
      return
    }

    // Start tracking activity
    resetTimer()
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      const last = parseInt(localStorage.getItem('ps_last_activity') ?? '0')
      if (Date.now() - last > getTimeoutSec() * 1000) lock()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, resetTimer))
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [lock, resetTimer])

  function handleUnlock() {
    setLocked(false)
    sessionStorage.removeItem('ps_locked')
    localStorage.setItem('ps_last_activity', Date.now().toString())
    resetTimer()
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.removeItem('ps_remember_me')
    localStorage.removeItem('ps_pin_hash')
    localStorage.removeItem('ps_pin_timeout')
    localStorage.removeItem('ps_last_activity')
    sessionStorage.clear()
    router.push('/login')
  }

  if (!locked) return null
  return <PinLockScreen onUnlock={handleUnlock} onSignOut={handleSignOut} />
}
