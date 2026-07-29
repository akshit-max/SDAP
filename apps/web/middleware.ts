import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/vaults'];
const authRoutes = ['/login'];

export function middleware(request: NextRequest) {
  // In a real application, we'd verify the JWT structure/expiration here.
  // For now, since we are using localStorage on the client for the token,
  // we can only check if a token cookie exists.
  // Wait, if token is in localStorage, middleware (Edge runtime) cannot read it!
  // We must implement client-side protection or a cookie.
  // The plan specified: "For local development only, localStorage is acceptable."
  // However, Next.js Middleware CANNOT read localStorage.
  // Let's check for a cookie. If no cookie, we'll let the client handle it 
  // or we can set a dummy cookie during login to make middleware work.
  // For now, we will just let it pass or redirect if we use cookies.
  
  const token = request.cookies.get('sdap_token')?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !token) {
    // Redirect to login if accessing protected route without a token cookie
    // Note: We'll need to set this cookie on login alongside localStorage
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token) {
    // Redirect to dashboard if already logged in
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
