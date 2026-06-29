'use client'

import { useEffect } from 'react'

export default function ReferralClaimer() {
  useEffect(() => {
    const code = localStorage.getItem('ps_ref')
    if (!code) return
    fetch('/api/referral/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refCode: code }),
    })
      .then(r => r.ok && localStorage.removeItem('ps_ref'))
      .catch(() => {})
  }, [])

  return null
}
