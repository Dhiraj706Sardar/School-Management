import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './utils/auth';

export const runtime = 'nodejs';

// Public paths that don't require authentication
const publicPaths = [
  '/',
  '/login',
  '/api/auth/send-otp',
  '/api/auth/verify-otp',
];

// API routes that have mixed access (some methods public, some protected)
const mixedAccessPaths = [
  { 
    path: '/api/schools', 
    publicMethods: ['GET', 'OPTIONS'],
    protectedMethods: ['POST', 'PUT', 'DELETE', 'PATCH']
  }
];

// Check if a path requires authentication
function requiresAuth(path: string, method: string): boolean {
  // Check public paths
  if (publicPaths.some(p => path.startsWith(p))) {
    return false;
  }

  // Check mixed access paths
  const mixedPath = mixedAccessPaths.find(p => path.startsWith(p.path));
  if (mixedPath) {
    if (mixedPath.publicMethods.includes(method)) {
      return false;
    }
    if (mixedPath.protectedMethods.includes(method)) {
      return true;
    }
  }

  // Default to protected for all other paths
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  
  // Get token from cookies or Authorization header
  const token = request.cookies.get('school_management_token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  // Set CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (method === 'OPTIONS') {
      return response;
    }

    // Check if the route requires authentication
    if (requiresAuth(pathname, method)) {
      if (!token) {
        console.log(`🔒 Unauthorized access attempt to ${pathname}`);
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        console.log(`❌ Invalid token for ${pathname}`);
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
      
      // Add user info to request headers for API routes
      request.headers.set('x-user-id', String(decoded.userId));
      request.headers.set('x-user-email', decoded.email);
      if (decoded.role) {
        request.headers.set('x-user-role', decoded.role);
      }
    }
    
    return response;
  }

  // Handle protected pages (non-API routes)
  if (requiresAuth(pathname, method)) {
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