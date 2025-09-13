'server-only';

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-jwt-secret-key';
const TOKEN_COOKIE_NAME = 'school_management_token';

export interface JwtPayload {
  userId: number;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

// Server-side cookie handling
type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  path?: string;
  maxAge?: number;
};

// Get auth token from cookies
export async function getAuthToken(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return undefined;
  }
}

// Set auth cookie with options
export async function setAuthToken(token: string, options: CookieOptions = {}): Promise<void> {
  try {
    const cookieStore = await cookies();
    
    await cookieStore.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: options.httpOnly ?? true,
      secure: options.secure ?? process.env.NODE_ENV === 'production',
      sameSite: options.sameSite ?? 'lax',
      path: options.path ?? '/',
      maxAge: options.maxAge ?? 60 * 60 * 24, // 1 day
    });
  } catch (error) {
    console.error('Error setting auth cookie:', error);
  }
}

// Clear auth cookie
export async function clearAuthToken(): Promise<void> {
  try {
    const cookieStore = await cookies();
    await cookieStore.delete(TOKEN_COOKIE_NAME);
  } catch (error) {
    console.error('Error clearing auth cookie:', error);
  }
}

// Verify JWT token
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Get current user from token
export async function getCurrentUser(): Promise<JwtPayload | null> {
  const token = await getAuthToken();
  if (!token) return null;
  return verifyToken(token);
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

// Create a response with auth token set
// This is useful for API routes that need to set the auth cookie
export function createAuthenticatedResponse(token: string, data: any = {}) {
  const response = new Response(JSON.stringify({
    success: true,
    ...data
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  // Set the auth cookie
  setAuthToken(token);
  
  return response;
}
