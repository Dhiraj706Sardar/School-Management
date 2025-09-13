import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-jwt-secret-key';
const TOKEN_COOKIE_NAME = 'school_management_token';
const TOKEN_EXPIRY = '1d'; // Token expires in 1 day

export interface JwtPayload {
  userId: number;
  email: string;
  role?: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export const generateToken = (user: User): string => {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role || 'user'
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

export const createUserSession = async (email: string) => {
  try {
    // Check if user exists
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    let user: User;
    
    if (Array.isArray(users) && users.length > 0) {
      // Existing user
      user = users[0] as User;
    } else {
      // Create new user
      const [result] = await db.execute(
        'INSERT INTO users (email, name, role) VALUES (?, ?, ?)',
        [email, email.split('@')[0], 'user']
      );
      
      user = {
        id: (result as any).insertId,
        email,
        name: email.split('@')[0],
        role: 'user'
      };
    }

    // Generate token
    const token = generateToken(user);
    
    // Set HTTP-only cookie
    await setAuthCookie(token);
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    };
  } catch (error) {
    console.error('Error creating user session:', error);
    return {
      success: false,
      error: 'Failed to create user session'
    };
  }
};

export const verifyToken = (token: string): JwtPayload | null => {
  if (!token) {
    console.log('❌ No token provided for verification');
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Additional validation
    if (!decoded.userId || !decoded.email) {
      console.error('❌ Invalid token payload:', decoded);
      return null;
    }
    
    // Log token details without the signature
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      try {
        const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('🔍 Token details:', {
          algorithm: header.alg,
          type: header.typ,
          payload: {
            ...payload,
            // Convert exp from timestamp to human-readable date
            exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiration',
            iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'No issued at'
          },
          isExpired: payload.exp && payload.exp < Math.floor(Date.now() / 1000)
        });
      } catch (e) {
        console.error('❌ Error parsing token:', e);
      }
    }

    console.log('✅ Token verified successfully');
    return decoded;
  } catch (error) {
    console.error('❌ Token verification failed:', error instanceof Error ? error.message : error);
    return null;
  }
};

export const setAuthCookie = async (token: string) => {
  const cookieStore = await cookies();
  cookieStore.set({
    name: TOKEN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day in seconds
  });
};

export const getAuthToken = async (): Promise<string | undefined> => {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE_NAME)?.value;
};

export const clearAuthCookie = (response?: any) => {
  // Clear the main auth cookie
  const cookieOptions = {
    path: '/',
    expires: new Date(0), // Set to past date to expire
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  };

  // If we have a response object, set the cookie on it
  if (response) {
    response.cookies.set(TOKEN_COOKIE_NAME, '', cookieOptions);
    // Clear other auth-related cookies
    ['session', 'session.sig', 'connect.sid'].forEach(cookieName => {
      response.cookies.set(cookieName, '', cookieOptions);
    });
    return; // Exit early if we've handled the response object
  }

  // Client-side cookie clearing (when no response object is available)
  if (typeof document !== 'undefined') {
    const clearCookie = (name: string) => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    };
    
    clearCookie(TOKEN_COOKIE_NAME);
    ['session', 'session.sig', 'connect.sid'].forEach(clearCookie);
  }
  
  // Clear client-side storage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    sessionStorage.clear();
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};
