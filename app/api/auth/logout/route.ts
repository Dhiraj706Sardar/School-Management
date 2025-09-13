import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/utils/auth';

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear the auth cookie
    clearAuthCookie();

    return response;
  } catch (error) {
    console.error('Error in logout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
