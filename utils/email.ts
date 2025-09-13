import nodemailer from 'nodemailer';

// Create a reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration
transporter.verify((error) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to take our messages');
  }
});

interface SendOtpEmailParams {
  email: string;
  otp: string;
  name?: string;
}

/**
 * Sends an OTP email to the specified email address
 * @param params - Object containing email, otp, and optional name
 * @returns Promise that resolves to an object with success status and optional error message
 */
export const sendOtpEmail = async ({
  email,
  otp,
  name = 'User',
}: SendOtpEmailParams): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email configuration is missing');
    }

    const mailOptions = {
      from: `"School Management" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for School Management',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a365d;">Your One-Time Password (OTP)</h2>
          <p>Hello ${name},</p>
          <p>Use the following OTP to verify your account. This OTP is valid for 10 minutes.</p>
          
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; 
                      font-size: 24px; letter-spacing: 5px; font-weight: bold; color: #1a365d;">
            ${otp}
          </div>
          
          <p>If you didn't request this OTP, please ignore this email or contact support.</p>
          <p>Best regards,<br>School Management Team</p>
        </div>
      `,
      text: `Your OTP is: ${otp}\n\nThis OTP is valid for 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
};
