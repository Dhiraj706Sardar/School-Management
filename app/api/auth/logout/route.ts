import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/utils/auth';

export async function POST(request: Request) {
  try {
    const response = NextResponse.redirect(new URL('/login', request.url));
    
    // Clear all auth-related cookies and storage
    clearAuthCookie(response);
    
    // Set cache control headers to prevent caching of the response
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    
    return response;
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Failed to log out. Please try again.' },
      { status: 500 }
    );
  }
}

// Prevent caching of the logout response
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
