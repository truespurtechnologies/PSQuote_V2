import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'
import { Database } from '@/lib/types/supabase'

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
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.delete(name);
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.delete(name);
          },
        },
      }
    );

    // Get the session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Handle public paths
    if (isPublicPath(currentPath)) {
      // Always allow access to these auth pages regardless of session
      if (['/forgot-password', '/update-password', '/reset-password'].includes(currentPath)) {
        return response;
      }
      
      // If user is already logged in and tries to access other auth pages, redirect to landing
      if (['/login', '/signup'].includes(currentPath) && session) {
        return NextResponse.redirect(new URL('/landing', request.url));
      }
      return response;
    }

    // If there's no session and this is a protected route, redirect to login
    if (!session) {
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

    // If we have a valid session, ensure we're not on auth pages (except update-password)
    if (['/login', '/signup', '/forgot-password', '/reset-password'].includes(currentPath)) {
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
    console.error('Middleware error:', error);
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
