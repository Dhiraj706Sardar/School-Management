import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { generateToken, setAuthCookie } from '@/utils/auth';

// In-memory store for development (fallback)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Rate limiting for verification attempts
const verifyRateLimit = new Map<string, { count: number; lastAttempt: number }>();
const VERIFY_RATE_LIMIT = {
  WINDOW_MS: 10 * 60 * 1000, // 10 minutes
  MAX_ATTEMPTS: 5,
};

interface VerifyOtpRequest {
  email: string;
  otp: string;
  name?: string;
}

export async function POST(request: Request) {
  try {
    const { email, otp, name }: VerifyOtpRequest = await request.json();
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();

    // Input validation
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
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
    const clientData = verifyRateLimit.get(clientIp) || { count: 0, lastAttempt: 0 };
    
    if (now - clientData.lastAttempt < VERIFY_RATE_LIMIT.WINDOW_MS) {
      if (clientData.count >= VERIFY_RATE_LIMIT.MAX_ATTEMPTS) {
        return NextResponse.json(
          { 
            error: 'Too many verification attempts. Please try again later.',
            retryAfter: Math.ceil((clientData.lastAttempt + VERIFY_RATE_LIMIT.WINDOW_MS - now) / 1000)
          },
          { 
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil(VERIFY_RATE_LIMIT.WINDOW_MS / 1000)),
              'X-RateLimit-Limit': String(VERIFY_RATE_LIMIT.MAX_ATTEMPTS),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(clientData.lastAttempt + VERIFY_RATE_LIMIT.WINDOW_MS)
            }
          }
        );
      }
      clientData.count++;
    } else {
      clientData.count = 1;
    }
    clientData.lastAttempt = now;
    verifyRateLimit.set(clientIp, clientData);

    let otpRecord: any = null;
    
    try {
      // First try database
      const [rows] = await db.execute(
        `SELECT * FROM otp_verification 
         WHERE email = ? AND otp = ? AND is_used = 0 AND expires_at > NOW()
         ORDER BY created_at DESC 
         LIMIT 1`,
        [email, otp]
      ) as any[];
      otpRecord = rows[0];
    } catch (dbError) {
      console.error('Database error, falling back to in-memory store:', dbError);
      // Fallback to in-memory store if database fails
      const storedOtp = otpStore.get(email);
      if (storedOtp && storedOtp.otp === otp && storedOtp.expiresAt > now) {
        otpRecord = { id: 'memory', email, otp };
      }
    }

    if (!otpRecord) {
      return NextResponse.json(
        { 
          error: 'Invalid or expired OTP',
          remainingAttempts: VERIFY_RATE_LIMIT.MAX_ATTEMPTS - clientData.count
        },
        { status: 400 }
      );
    }

    // Mark OTP as used (only if it's in the database)
    if (otpRecord.id !== 'memory') {
      try {
        await db.execute(
          'UPDATE otp_verification SET is_used = 1 WHERE id = ?',
          [otpRecord.id]
        );
      } catch (dbError) {
        console.error('Error marking OTP as used:', dbError);
        // Continue with login even if we can't mark as used
      }
    } else {
      // Remove from in-memory store
      otpStore.delete(email);
    }

    // Find or create school admin
    let [schools] = await db.execute(
      'SELECT id, email_id as email, name FROM schools WHERE email_id = ?',
      [email]
    ) as any[];

    let user: any;
    if (schools.length === 0) {
      // Create new user with a default role of 'user'
      const [result] = await db.execute(
        'INSERT INTO schools (name, email_id, contact, address, city, state) VALUES (?, ?, ?, ?, ?, ?)',
        [
          email.split('@')[0], // name
          email,              // email_id
          '',                 // contact
          'Not specified',    // address
          'Unknown',          // city
          'Unknown'           // state
        ]
      ) as any;
      user = {
        id: result.insertId,
        email,
        name: name || email.split('@')[0],
        role: 'user' // Default role for new users
      };
    } else {
      user = {
        ...schools[0],
        role: 'user' // Default role for existing users
      };
    }

    // Generate JWT token with user data
    const token = generateToken({
      userId: user.id,
      email: user.email
    });
    
    // Create success response
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'OTP verified successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
    
    // Set secure, HTTP-only cookie
    await setAuthCookie(token);
    
    // Set additional user data in response headers
    response.headers.set('X-User-Id', user.id.toString());
    response.headers.set('X-User-Email', user.email);
    response.headers.set('X-User-Name', user.name || '');
    response.headers.set('X-User-Role', user.role || 'user');
    
    return response;
  } catch (error) {
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
