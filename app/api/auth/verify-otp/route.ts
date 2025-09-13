import { NextResponse } from 'next/server';
import { verifyOTP } from '@/utils/otp';
import { createUserSession } from '@/utils/auth';

export const runtime = 'nodejs';

// Rate limiting cache
const rateLimit = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT = {
  WINDOW_MS: 5 * 60 * 1000, // 5 minutes
  MAX_ATTEMPTS: 5,
};

interface VerifyOtpRequest {
  email: string;
  otp: string;
}

// Handle rate limiting
function handleRateLimit(clientIp: string, now: number): { allowed: boolean; response?: NextResponse } {
  const clientData = rateLimit.get(clientIp) || { count: 0, lastAttempt: 0 };
  
  // Reset count if window has passed
  if (now - clientData.lastAttempt > RATE_LIMIT.WINDOW_MS) {
    rateLimit.set(clientIp, { count: 1, lastAttempt: now });
    return { allowed: true };
  }
  
  // Check if rate limit exceeded
  if (clientData.count >= RATE_LIMIT.MAX_ATTEMPTS) {
    return {
      allowed: false,
      response: NextResponse.json(
        { success: false, error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(RATE_LIMIT.WINDOW_MS / 1000) } }
      )
    };
  }
  
  // Update rate limit
  rateLimit.set(clientIp, { count: clientData.count + 1, lastAttempt: now });
  return { allowed: true };
}

// Validate request data
function validateRequest(data: unknown): data is VerifyOtpRequest {
  return (
    typeof data === 'object' &&
    data !== null &&
    'email' in data &&
    'otp' in data &&
    typeof (data as VerifyOtpRequest).email === 'string' &&
    typeof (data as VerifyOtpRequest).otp === 'string'
  );
}

export async function POST(request: Request) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitCheck = handleRateLimit(clientIp, Date.now());
    if (!rateLimitCheck.allowed) {
      return rateLimitCheck.response!;
    }

    const data = await request.json();
    
    // Validate request data
    if (!validateRequest(data)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data. Email and OTP are required.' },
        { status: 400 }
      );
    }

    const { email, otp } = data;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Verify OTP
    const otpResult = await verifyOTP(email, otp);
    if (!otpResult.success) {
      return NextResponse.json(
        { success: false, error: otpResult.message || 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Create user session (creates user if doesn't exist)
    const session = await createUserSession(email);
    if (!session.success) {
      return NextResponse.json(
        { success: false, error: session.error || 'Failed to create user session' },
        { status: 500 }
      );
    }

    // Return success response with user data
    return NextResponse.json({
      success: true,
      user: session.user,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Error in verify-otp:', error);
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR'
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }
}
