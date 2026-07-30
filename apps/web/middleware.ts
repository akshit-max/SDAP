import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * AUTH_COOKIE_NAME must match the cookie name set in token.ts.
 * Single source of truth — update both if the name ever changes.
 */
const AUTH_COOKIE_NAME = 'sdap_token';

/**
 * All routes that require an authenticated session.
 * A non-httpOnly cookie is set alongside localStorage in token.ts
 * so the Edge middleware can read it for server-side route protection.
 *
 * Note (Release B): This will be replaced by an httpOnly cookie
 * once auth storage is migrated. The middleware will not need changes —
 * only the cookie attributes in token.ts will change.
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/vaults',
  '/sessions',
  '/approvals',
  '/audit',
  '/settings',
];

/** Routes that logged-in users should not see (redirect to dashboard). */
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route),
  );
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
