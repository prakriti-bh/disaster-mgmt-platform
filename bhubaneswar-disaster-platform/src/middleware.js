import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/registration-success',
  '/api/auth/login',
  '/api/auth/register',
];

// Routes that require CSRF protection
const csrfProtectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

export async function middleware(request) {
  const { pathname, searchParams } = new URL(request.url);

  // Allow public assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/locales') ||
    (pathname.startsWith('/api/resources') && request.method === 'GET') ||
    (pathname.startsWith('/api/alerts') && request.method === 'GET')
  ) {
    return NextResponse.next();
  }

  // Skip auth check for public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for auth token in protected routes
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    await jwtVerify(token, secret);

    // CSRF protection for state-changing operations
    if (csrfProtectedMethods.includes(request.method)) {
      const csrfToken = request.headers.get('x-csrf-token');
      const storedToken = request.cookies.get('csrf-token')?.value;

      if (!csrfToken || !storedToken || csrfToken !== storedToken) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Auth error:', error);
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}