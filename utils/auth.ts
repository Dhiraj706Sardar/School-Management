import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_COOKIE_NAME = 'school_management_token';
const TOKEN_EXPIRY = '1d'; // Token expires in 1 day

export interface JwtPayload {
  userId: number;
  email: string;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
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

export const clearAuthCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  if (!token) return false;
  return verifyToken(token) !== null;
};

export const getCurrentUser = async (): Promise<JwtPayload | null> => {
  const token = await getAuthToken();
  if (!token) return null;
  return verifyToken(token);
};
