import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/utils/auth';

export const runtime = 'nodejs';

export async function POST() {
  try {
    // Clear the authentication cookie
    await clearAuthCookie();
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully signed out' 
    });
  } catch (error) {
    console.error('Error in signout:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to sign out',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
