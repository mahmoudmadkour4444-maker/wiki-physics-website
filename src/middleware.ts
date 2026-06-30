import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ===== SECURITY HEADERS =====

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy - don't leak info
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy - strong protection
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://lh3.googleusercontent.com https://i.ytimg.com https://dogpqfnthvkcqsprqjsy.supabase.co",
      "media-src 'self' blob: https://www.youtube.com https://dogpqfnthvkcqsprqjsy.supabase.co",
      "frame-src https://www.youtube.com https://youtube.com https://vercel.live",
      "connect-src 'self' https://wiki-5fdb9-default-rtdb.firebaseio.com https://api.telegram.org https://dogpqfnthvkcqsprqjsy.supabase.co",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // Permissions Policy - restrict browser features
  response.headers.set(
    'Permissions-Policy',
    [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
    ].join(', ')
  );

  // Strict Transport Security
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  // Cross-Origin policies
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  // Cache control for sensitive pages
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  // Block common attack paths
  const pathname = request.nextUrl.pathname;
  const blockedPaths = [
    '/.env', '/.git', '/.config', '/.htaccess', '/wp-admin', '/wp-login',
    '/xmlrpc.php', '/admin.php', '/phpmyadmin', '/server-status',
    '/.well-known/security.txt', '/actuator', '/swagger', '/api-docs',
  ];

  if (blockedPaths.some(p => pathname.toLowerCase().startsWith(p))) {
    return new NextResponse(null, { status: 404 });
  }

  // Rate limiting check (basic - via cookie)
  if (pathname.startsWith('/api/')) {
    const rateLimitCookie = request.cookies.get('rl_cnt')?.value;
    const rlTime = request.cookies.get('rl_time')?.value;
    const now = Date.now();

    let count = parseInt(rateLimitCookie || '0');
    const lastTime = parseInt(rlTime || '0');

    // Reset counter every 60 seconds
    if (now - lastTime > 60000) {
      count = 0;
    }

    count++;

    if (count > 100) {
      // Too many requests - 429
      const retryResponse = new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
      return retryResponse;
    }

    response.cookies.set('rl_cnt', count.toString(), { maxAge: 60, httpOnly: true });
    response.cookies.set('rl_time', now.toString(), { maxAge: 60, httpOnly: true });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
