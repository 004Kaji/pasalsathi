import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/db/supabase'

// In-memory rate limit: 5 failed attempts per IP per 15 min. Resets on cold start,
// but still makes brute-forcing a 4-digit PIN impractical within a window.
const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now > entry.resetAt) return false
  return entry.count >= MAX_ATTEMPTS
}

function recordFailure(ip: string) {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
  } else {
    entry.count++
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 })
  }

  const { businessCode, name, pin } = await req.json() as { businessCode: string; name: string; pin: string }

  if (!businessCode?.trim() || !name?.trim() || !pin) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Find business by referral code (business code shopkeepers share with staff)
  const { data: business } = await admin
    .from('businesses')
    .select('id, name')
    .eq('referral_code', businessCode.toUpperCase().trim())
    .single()

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  // Find active staff by name in that business
  const { data: staffList } = await admin
    .from('staff')
    .select('id, name, pin_hash')
    .eq('business_id', business.id)
    .eq('active', true)
    .ilike('name', name.trim())
    .limit(5)

  if (!staffList || staffList.length === 0) {
    return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
  }

  // Try each match (case-insensitive name search may return multiple)
  const matched = staffList.find(s => s.name.toLowerCase() === name.trim().toLowerCase())
  if (!matched) return NextResponse.json({ error: 'Staff not found' }, { status: 404 })

  const valid = await bcrypt.compare(pin, matched.pin_hash)
  if (!valid) {
    recordFailure(ip)
    return NextResponse.json({ error: 'Wrong PIN' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true, businessName: business.name, staffName: matched.name })
  // Simple cookie: staffId|businessId — read in middleware
  res.cookies.set('ps_staff', `${matched.id}|${business.id}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 12, // 12 hours
    path: '/',
  })
  return res
}
