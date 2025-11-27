import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

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

// Short link slugs - don't protect single-segment paths that aren't reserved
const reservedPaths = ['dashboard', 'api', 'sign-in', 'sign-up', 'pricing', 'docs', '_next']
const isShortLink = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)
  return segments.length === 1 && !reservedPaths.includes(segments[0])
}

export default clerkMiddleware(async (auth, req) => {
  // Allow short links without auth
  if (isShortLink(req.nextUrl.pathname)) {
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
