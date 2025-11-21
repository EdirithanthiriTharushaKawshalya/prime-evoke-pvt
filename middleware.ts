import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is set, update the request cookies.
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Update the response cookies in the cloned response.
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the request cookies.
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // Update the response cookies in the cloned response.
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - important!
  const { data: { user } } = await supabase.auth.getUser()

  // Define protected routes
  // "startsWith('/admin')" will automatically cover /admin, /admin/bookings, /admin/stock, etc.
  const protectedPaths = ['/admin']; 
  const currentPath = request.nextUrl.pathname;

  // If trying to access a protected route and NOT logged in, redirect to login
  if (!user && protectedPaths.some(path => currentPath.startsWith(path))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged IN and trying to access the login page, redirect to the NEW ADMIN HUB
  if (user && currentPath === '/login') {
     // CHANGE: Redirect to '/admin' instead of '/admin/bookings'
     return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Allow the request to continue
  return response
}

// Specify which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Images inside /public (if any specific ones cause issues)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/admin/:path*', // Specifically include admin routes
    '/login',        // Specifically include login route
  ],
}