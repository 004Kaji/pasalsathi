import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const staffCookie = req.cookies.get('ps_staff')?.value
  if (staffCookie) return NextResponse.json({ ok: true })
  return NextResponse.json({ ok: false }, { status: 401 })
}
