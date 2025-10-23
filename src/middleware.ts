// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * ROLE: Fast hint-based protection (NOT authoritative)
 * - Protects routes from unauthenticated access (redirect TO signin)
 * - Protects auth pages from authenticated access (redirect TO dashboard)
 * - UnifiedAuthGuard provides backup verification
 */

const AUTH_ROUTES = [
    '/signin',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
];

const PROTECTED_ROUTES = [
    '/ai-script-analysis',
    '/ai-script-editor',
    '/ai-script-generator',
    '/ai-script-library',
    '/user-legal',
    '/dashboard',
    '/profile',
    '/settings',
    '/create-now',
    '/notifications',
    '/billing',
    '/payments',
    '/assets',
    '/image-editor',
    '/story',
    '/ai'
];

const ADMIN_ROUTES = [
    '/impersonation',
    '/scripts',
    '/test',
    '/admin'
];

// Routes that should never be blocked by middleware
const ALWAYS_ALLOW = [
    '/api',
    '/_next',
    '/static',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/legal'
];

/**
 * Check for auth token cookie (hint only, not secure verification)
 */
function hasAuthHint(request: NextRequest): boolean {
    const authToken = request.cookies.get('auth_token');
    return !!authToken?.value;
}

/**
 * Check if route matches pattern
 * Special handling for root path to avoid matching everything
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
    return routes.some(route => {
        // Exact match for root path
        if (route === '/' && pathname === '/') {
            return true;
        }
        // For other routes, check startsWith but not for root
        if (route !== '/' && pathname.startsWith(route)) {
            return true;
        }
        return false;
    });
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip static assets and legal pages
    if (ALWAYS_ALLOW.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Skip files with extensions
    if (pathname.includes('.') && !pathname.endsWith('/')) {
        return NextResponse.next();
    }

    const hasAuth = hasAuthHint(request);
    const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);
    const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES);
    const isAdminRoute = matchesRoute(pathname, ADMIN_ROUTES);

    // 1. Redirect authenticated users AWAY from auth pages (FAST)
    if (hasAuth && isAuthRoute) {
        // Check if they were trying to access a protected page
        const from = request.nextUrl.searchParams.get('from');
        if (from && from.startsWith('/') && !from.startsWith('//')) {
            return NextResponse.redirect(new URL(from, request.url));
        }
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 2. Redirect unauthenticated users TO signin (FAST)
    if (!hasAuth && (isProtectedRoute || isAdminRoute)) {
        const signInUrl = new URL('/signin', request.url);
        signInUrl.searchParams.set('from', pathname);
        console.log('[Middleware] Redirecting unauthenticated user to signin');
        return NextResponse.redirect(signInUrl);
    }

    // Pass through everything else
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
    ],
};