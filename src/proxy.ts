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
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password')
  const isPublic   = isAuthPage || pathname === '/' || pathname.startsWith('/auth/') || pathname.startsWith('/update-password') || pathname === '/staff-login' || pathname.startsWith('/privacy') || pathname.startsWith('/blog')

  // Authenticated users hitting the landing page → send straight to the app
  if (user && pathname === '/') {
    return NextResponse.redirect(new URL('/sell', request.url))
  }

  // Staff cookie grants access to /sell only
  const staffCookie = request.cookies.get('ps_staff')?.value
  if (!user && staffCookie && pathname.startsWith('/sell')) {
    return supabaseResponse
  }

  if (!user && !isPublic) {
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
