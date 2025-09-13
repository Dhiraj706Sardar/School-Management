import db from '@/lib/db';
import { sendOtpEmail } from './email';

export const OTP_EXPIRY_MINUTES = 15; // OTP expires in 15 minutes

export async function generateAndSendOTP(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    // Save OTP to database
    await db.execute(
      'INSERT INTO otp_verification (email, otp, expires_at, is_used) VALUES (?, ?, ?, FALSE) ' +
      'ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = VALUES(expires_at), is_used = FALSE',
      [email, otp, expiresAt]
    );

    // Send OTP via email
    const emailSent = await sendOtpEmail({
      email,
      otp,
      name: email.split('@')[0]
    });

    if (!emailSent) {
      throw new Error('Failed to send OTP email');
    }

    return {
      success: true,
      message: 'OTP sent successfully'
    };
  } catch (error) {
    console.error('Error in generateAndSendOTP:', error);
    return {
      success: false,
      message: 'Failed to generate and send OTP'
    };
  }
}

export async function verifyOTP(email: string, otp: string): Promise<{ success: boolean; message: string }> {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM otp_verification WHERE email = ? AND otp = ? AND is_used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        success: false,
        message: 'Invalid or expired OTP'
      };
    }

    // Mark OTP as used
    await db.execute(
      'UPDATE otp_verification SET is_used = TRUE WHERE email = ? AND otp = ?',
      [email, otp]
    );

    return {
      success: true,
      message: 'OTP verified successfully'
    };
  } catch (error) {
    console.error('Error in verifyOTP:', error);
    return {
      success: false,
      message: 'Failed to verify OTP'
    };
  }
}

// Clean up expired OTPs
setInterval(async () => {
  try {
    await db.execute(
      'DELETE FROM otp_verification WHERE expires_at < NOW() - INTERVAL 1 DAY'
    );
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
  }
}, 3600000); // Run every hour
