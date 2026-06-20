import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'
import { Database } from '@/lib/database.types'
import { log } from '@/lib/logger'

// Define types for better type safety
type SupabaseClient = ReturnType<typeof createServerClient<Database>>;

// List of public paths that don't require authentication
const publicPaths = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/update-password',
  '/auth/callback',
  '/_next/static',
  '/_next/image',
  '/favicon.ico',
  '/images/',
  '/api/auth/'
];

// Check if the current path is public
const isPublicPath = (path: string): boolean => {
  if (!path) return false;
  
  // Normalize the path
  const normalizedPath = path.toLowerCase().split('?')[0];
  
  return publicPaths.some(publicPath => 
    normalizedPath === publicPath || 
    normalizedPath.startsWith(`${publicPath}/`) ||
    normalizedPath.endsWith(publicPath) ||
    normalizedPath.includes(publicPath)
  );
};

export async function middleware(request: NextRequest) {
  try {
    // Skip middleware for API routes and static files
    if (request.nextUrl.pathname.startsWith('/api/') || 
        request.nextUrl.pathname.includes('.') ||
        request.nextUrl.pathname.startsWith('/_next/')) {
      return NextResponse.next();
    }

    const currentPath = request.nextUrl.pathname;
    
    // Create a response object that we'll modify based on auth state
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Create a Supabase client for server-side operations
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // Modify existing response instead of creating new one
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            // Modify existing response instead of creating new one
            request.cookies.delete(name);
            response.cookies.delete(name);
          },
        },
      }
    );

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Debug logging
    const cookieNames = request.cookies.getAll().map(c => c.name);
    log.debug('Middleware session check', {
      path: currentPath,
      hasSession: !!session,
      authCookies: cookieNames.filter(n => n.includes('sb-')),
      userAgent: request.headers.get('user-agent') || undefined
    });
    
    if (sessionError) {
      log.error('Middleware session error', {
        error: sessionError.message || 'Unknown session error',
        path: currentPath
      });
    }
    
    // Handle public paths
    if (isPublicPath(currentPath)) {
      // Always allow access to these auth pages regardless of session
      if (['/forgot-password', '/update-password', '/reset-password'].includes(currentPath)) {
        return response;
      }
      
      // If user is already logged in and tries to access other auth pages, redirect to landing
      if (['/login', '/signup'].includes(currentPath) && session) {
        log.info('User logged in, redirecting from auth page', {
          from: currentPath,
          to: '/landing',
          userId: session.user.id
        });
        return NextResponse.redirect(new URL('/landing', request.url));
      }
      return response;
    }

    // If there's no session and this is a protected route, redirect to login
    if (!session) {
      log.info('No session, redirecting to login', {
        from: currentPath,
        to: '/login'
      });
      // Don't redirect if we're already on the login or update-password page to prevent loops
      if (!['/login', '/update-password'].includes(currentPath)) {
        const loginUrl = new URL('/login', request.url);
        // Only set redirectedFrom if we're not already on an auth page
        if (!['/login', '/signup', '/forgot-password', '/reset-password', '/update-password'].includes(currentPath)) {
          loginUrl.searchParams.set('redirectedFrom', currentPath);
        }
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }
    
    log.debug('Session verified, allowing access', {
      path: currentPath,
      userId: session.user.id
    });

    // If we have a valid session, ensure we're not on auth pages (except update-password)
    if (['/login', '/signup', '/forgot-password', '/reset-password'].includes(currentPath)) {
      return NextResponse.redirect(new URL('/landing', request.url));
    }

    // Redirect root path to landing page when authenticated
    if (currentPath === '/') {
      log.info('Redirecting root to landing page', {
        userId: session.user.id
      });
      return NextResponse.redirect(new URL('/landing', request.url));
    }

    // Add user info to request headers for server components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', session.user.id);
    requestHeaders.set('x-user-email', session.user.email || '');

    // Return the response with updated headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
  } catch (error) {
    log.error('Middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      path: request.nextUrl.pathname
    });
    // If there's an error, redirect to login with an error parameter
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'session_error');
    return NextResponse.redirect(loginUrl);
  }
}

// Configure which routes should be processed by this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/ (auth routes)
     * - api/auth (auth API routes)
     * - images/ (static images)
     * - login (login page)
     * - signup (signup page)
     * - forgot-password (password reset page)
     * - reset-password (password reset handler)
     * - update-password (password update page)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/|api/auth|images/|login|signup|forgot-password|reset-password|update-password).*)',
  ],
}
