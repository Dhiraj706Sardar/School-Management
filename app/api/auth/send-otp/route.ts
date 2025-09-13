import { NextResponse } from 'next/server';
import { generateAndSendOTP } from '@/utils/otp';
import { checkRateLimit, getRateLimitHeaders } from '@/utils/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await checkRateLimit(clientIp, 'send-otp');

    if (!rateLimitResult.isAllowed) {
      const headers = getRateLimitHeaders(rateLimitResult);
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(headers.entries())
          }
        }
      );
    }

    // Generate and send OTP
    const result = await generateAndSendOTP(email);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ 
      success: true, 
      message: result.message 
    });

    // Add rate limit headers to successful responses
    const headers = getRateLimitHeaders(rateLimitResult);
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error('Error in send-otp:', error instanceof Error ? error.message : 'Unknown error');
    
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'OTP already sent. Please wait before requesting a new one.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
