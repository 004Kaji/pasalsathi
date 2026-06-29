'use client'

import { useEffect } from 'react'

export default function ReferralClaimer() {
  useEffect(() => {
    const code = localStorage.getItem('ps_ref')
    if (!code) return
    localStorage.removeItem('ps_ref')
    fetch('/api/referral/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refCode: code }),
    }).catch(() => {})
  }, [])

  return null
}
