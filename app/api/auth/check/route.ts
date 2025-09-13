import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/utils/auth';

export async function GET() {
  try {
    const user = getCurrentUser();
    return NextResponse.json({ authenticated: !!user, user });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Error checking authentication status' },
      { status: 500 }
    );
  }
}
