import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/docs(.*)',
  '/api/webhooks(.*)',
  '/api/health',
  '/api/track(.*)',
  '/api/t(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

// Protected routes that need explicit redirect handling
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
])

// Short link slugs - don't protect single-segment paths that aren't reserved
const reservedPaths = ['dashboard', 'api', 'sign-in', 'sign-up', 'pricing', 'docs', '_next', 'onboarding']
const isShortLink = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)
  return segments.length === 1 && !reservedPaths.includes(segments[0])
}

export default clerkMiddleware(async (auth, req) => {
  // Allow short links without auth
  if (isShortLink(req.nextUrl.pathname)) {
    return
  }

  // Dev mode: skip auth entirely (both API and dashboard routes have their own dev bypass)
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    return
  }

  // For protected routes, check auth and redirect to sign-in if not authenticated
  if (isProtectedRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }
    return
  }

  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
