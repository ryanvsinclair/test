import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  console.log('[MIDDLEWARE] 🔵 Request:', pathname)

  // 1️⃣ Always allow public + auth + Next internals
  if (
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/browse' ||
    pathname === '/welcome' ||
    pathname === '/meet-carly' ||
    pathname === '/how-carly-works' ||
    pathname === '/privacy-policy' ||
    pathname === '/terms-of-use' ||
    pathname === '/help-center' ||
    pathname === '/contact-carly' ||
    pathname === '/trust-and-safety'
  ) {
    console.log('[MIDDLEWARE] 🟢 Public route, allowing:', pathname)
    return NextResponse.next()
  }

  // 2️⃣ Prepare response FIRST (required for Supabase SSR cookies)
  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  console.log('[MIDDLEWARE] 🔵 Calling getSession()...')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  console.log('[MIDDLEWARE] 🟢 Session status:', { hasSession: !!session, userId: session?.user?.id })

  // 🔐 ADMIN PAGE PROTECTION (PAGES ONLY)
  if (pathname.startsWith('/admin')) {
    console.log('[MIDDLEWARE] 🔵 Admin route check')
    if (
      !session ||
      !session.user ||
      session.user.user_metadata?.is_admin !== true
    ) {
      console.warn('[MIDDLEWARE] 🔴 Admin access denied, redirecting to /')
      return NextResponse.redirect(new URL('/', req.url))
    }

    console.log('[MIDDLEWARE] 🟢 Admin access granted')
    return response
  }

  // 3️⃣ Auth-required routes
  if (!session) {
    console.log('[MIDDLEWARE] 🔴 No session, redirecting to /auth from:', pathname)
    return NextResponse.redirect(new URL('/auth', req.url))
  }

  const isAdmin = session.user.user_metadata?.is_admin === true

  // Query profiles table for authoritative role and dealership_id
  console.log('[MIDDLEWARE] 🔵 Fetching profile...')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, dealership_id')
    .eq('id', session.user.id)
    .single()

  console.log('[MIDDLEWARE] 🟢 Profile:', { role: profile?.role, dealershipId: profile?.dealership_id })

  if (!profile && !isAdmin) {
    console.log('[MIDDLEWARE] 🔴 No profile, redirecting to /auth/account-invalid')
    return NextResponse.redirect(new URL('/auth/account-invalid', req.url))
  }

  const role = profile?.role || 'buyer'
  const dealershipId = profile?.dealership_id

  // 🔐 DEALER PORTAL GATING
  if (pathname.startsWith('/dealer')) {
    console.log('[MIDDLEWARE] 🔵 Dealer route check, role:', role)
    // Non-dealers cannot access
    if (role !== 'dealer') {
      console.log('[MIDDLEWARE] 🔴 Not a dealer, redirecting to /buyer')
      return NextResponse.redirect(new URL('/buyer', req.url))
    }
    
    // Dealers must have dealership_id
    if (!dealershipId) {
      console.log('[MIDDLEWARE] 🔵 No dealership_id')
      // No dealership = hasn't applied or not approved yet
      // Allow access to /dealer/apply only
      if (pathname !== '/dealer/apply') {
        console.log('[MIDDLEWARE] 🔴 Redirecting to /dealer/apply')
        return NextResponse.redirect(new URL('/dealer/apply', req.url))
      }
      console.log('[MIDDLEWARE] 🟢 Allowing /dealer/apply')
      return response
    }
    
    // Check dealership lifecycle status
    const { data: dealership } = await supabase
      .from('dealerships')
      .select('lifecycle_status, operational_status')
      .eq('id', dealershipId)
      .single()
    
    console.log('[MIDDLEWARE] 🔵 Dealership status:', dealership?.lifecycle_status)

    // Pending → waiting for admin approval, redirect to home
    if (dealership?.lifecycle_status === 'pending') {
      console.log('[MIDDLEWARE] 🔴 Dealership pending, redirecting to /')
      return NextResponse.redirect(new URL('/', req.url))
    }
    
    // Approved → must complete onboarding
    if (dealership?.lifecycle_status === 'approved' && pathname !== '/dealer/onboarding') {
      console.log('[MIDDLEWARE] 🔴 Dealership approved, redirecting to /dealer/onboarding')
      return NextResponse.redirect(new URL('/dealer/onboarding', req.url))
    }
    
    // Active → can access portal (but not onboarding)
    if (dealership?.lifecycle_status === 'active' && pathname === '/dealer/onboarding') {
      console.log('[MIDDLEWARE] 🔴 Dealership active, redirecting away from onboarding')
      return NextResponse.redirect(new URL('/dealer', req.url))
    }
    
    // Rejected → redirect to home
    if (dealership?.lifecycle_status === 'rejected') {
      console.log('[MIDDLEWARE] 🔴 Dealership rejected, redirecting to /')
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // 🔐 BUYER ROUTES
  if (pathname.startsWith('/buyer') && role !== 'buyer') {
    console.log('[MIDDLEWARE] 🔴 Not a buyer, redirecting to /dealer from:', pathname)
    return NextResponse.redirect(new URL('/dealer', req.url))
  }

  console.log('[MIDDLEWARE] 🟢 Allowing route:', pathname)
  return response
}

export const config = {
  matcher: [
    // ✅ EXPLICITLY EXCLUDE API ROUTES
    '/((?!api).*)',
  ],
}
