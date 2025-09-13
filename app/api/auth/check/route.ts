import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/utils/server-auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ 
      authenticated: !!user, 
      user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json(
      { 
        authenticated: false, 
        error: 'Error checking authentication status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
