import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // API routes that must work without a Supabase session — each verifies its own
  // auth: /api/auth/* serves signup/OTP + the Supabase SMS hook (Bearer secret),
  // /api/staff/* authenticates via the ps_staff cookie or checks the user itself
  const PUBLIC_API = ['/api/auth/', '/api/staff/']
  if (PUBLIC_API.some(p => pathname.startsWith(p))) {
    return supabaseResponse
  }

  // Explicitly list protected app routes — unknown routes pass through so Next.js serves its own 404
  const PROTECTED = ['/sell', '/khata', '/products', '/staff', '/reports', '/settings', '/supplier', '/hisab', '/home', '/api/']
  const isProtected = PROTECTED.some(p => pathname.startsWith(p))

  // Staff cookie grants access to /sell only
  const staffCookie = request.cookies.get('ps_staff')?.value
  if (!user && staffCookie && pathname.startsWith('/sell')) {
    return supabaseResponse
  }

  if (!user && isProtected) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icon$|apple-icon$|pwa-icon/|manifest\\.webmanifest|robots\\.txt|llms\\.txt|sitemap\\.xml|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
export { proxy as middleware }
