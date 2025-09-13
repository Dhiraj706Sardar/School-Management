import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './utils/auth';
import { cookies } from 'next/headers';

// Paths that don't require authentication
const publicPaths = [
  '/login',
  '/api/auth/send-otp',
  '/api/auth/verify-otp',
];

// Paths that require authentication
const protectedPaths = [
  '/manage',
  '/api/schools', // Assuming this is a protected API endpoint
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieStore = await cookies();
  // Get token from either cookie or Authorization header
  const token = 
    cookieStore.get('school_management_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  // Handle CORS for API routes
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return response;
    }

    // Check if the API route is protected
    const isProtectedApi = protectedPaths.some(path => 
      pathname.startsWith(path) && 
      !publicPaths.some(publicPath => pathname.startsWith(publicPath))
    );

    if (isProtectedApi) {
      if (!token || !verifyToken(token)) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    return response;
  }

  // Handle protected pages
  const isProtectedPage = protectedPaths.some(path => 
    pathname.startsWith(path) && 
    !publicPaths.some(publicPath => pathname.startsWith(publicPath))
  );

  if (isProtectedPage) {
    if (!token || !verifyToken(token)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/api/:path*',
  ],
};