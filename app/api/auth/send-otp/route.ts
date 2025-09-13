import { NextResponse } from 'next/server';
import { sendOtpEmail } from '@/utils/email';
import db from '@/lib/db';

// In-memory store for development (use Redis in production)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Generate a 6-digit OTP
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Rate limiting cache
const rateLimit = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT = {
  WINDOW_MS: 60 * 1000, // 1 minute
  MAX_REQUESTS: 3,
};

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check rate limiting
    const now = Date.now();
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const clientData = rateLimit.get(clientIp) || { count: 0, lastAttempt: 0 };

    if (now - clientData.lastAttempt < RATE_LIMIT.WINDOW_MS) {
      if (clientData.count >= RATE_LIMIT.MAX_REQUESTS) {
        return NextResponse.json(
          { 
            error: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((clientData.lastAttempt + RATE_LIMIT.WINDOW_MS - now) / 1000)
          },
          { 
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil(RATE_LIMIT.WINDOW_MS / 1000)),
              'X-RateLimit-Limit': String(RATE_LIMIT.MAX_REQUESTS),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(clientData.lastAttempt + RATE_LIMIT.WINDOW_MS)
            }
          }
        );
      }
      clientData.count++;
    } else {
      clientData.count = 1;
      clientData.lastAttempt = now;
    }
    rateLimit.set(clientIp, clientData);

    // Generate OTP and set expiry (10 minutes from now)
    const otp = generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    try {
      // Save OTP to database
      await db.execute(
        'INSERT INTO otp_verification (email, otp, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?',
        [email, otp, expiresAt, otp, expiresAt]
      );
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Fallback to in-memory storage if database fails
      otpStore.set(email, { otp, expiresAt: expiresAt.getTime() });
    }

    // Send OTP via email
    const { success, error } = await sendOtpEmail({ email, otp, name });

    if (!success) {
      console.error('Email sending failed:', error);
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      // In production, you might want to remove this in production
      debug: { otp },
    });
  } catch (error: any) {
    console.error('Error in send-otp:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
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
