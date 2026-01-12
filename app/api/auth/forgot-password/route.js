// app/api/auth/forgot-password/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { logActivity } from '@/lib/auth';
import User from '@/models/User';
import connectDB from '@/lib/db';
import ResetToken from '@/models/ResetToken';

export const runtime = 'nodejs';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // For security reasons, don't reveal if user exists or not
    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return NextResponse.json({ 
        message: 'If an account exists with this email, you will receive password reset instructions.' 
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return NextResponse.json(
        { error: 'Account not verified. Please verify your account first.' },
        { status: 400 }
      );
    }

    // Generate reset token and OTP
    const token = crypto.randomBytes(32).toString('hex');
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    
    // Store token in database with expiry (1 hour)
    const resetToken = new ResetToken({
      email: user.email,
      token,
      otp,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      userId: user._id,
    });
    
    await resetToken.save();

    // Remove any existing tokens for this user
    await ResetToken.deleteMany({ 
      email: user.email, 
      _id: { $ne: resetToken._id } 
    });

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Seizure Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - Seizure Management System',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background: #10B981; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0; 
                font-weight: bold;
              }
              .code { 
                font-family: monospace; 
                font-size: 24px; 
                letter-spacing: 5px; 
                padding: 10px 20px; 
                background: #f0f0f0; 
                border-radius: 5px; 
                margin: 20px 0; 
                text-align: center;
                border: 2px dashed #10B981;
              }
              .footer { 
                margin-top: 20px; 
                padding-top: 20px; 
                border-top: 1px solid #ddd; 
                color: #666; 
                font-size: 12px; 
              }
              .warning {
                background: #FEF3C7;
                border-left: 4px solid #D97706;
                padding: 10px;
                margin: 15px 0;
                border-radius: 4px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${user.name}</strong>,</p>
                
                <p>You have requested to reset your password for the Seizure Management System.</p>
                
                <div class="warning">
                  <strong>⚠️ Security Notice:</strong> If you did not request this, please ignore this email and ensure your account is secure.
                </div>
                
                <p><strong>Your verification code is:</strong></p>
                
                <div class="code">${otp}</div>
                
                <p>This code expires in 1 hour.</p>
                
                <p><strong>Alternatively,</strong> you can click the button below to reset your password:</p>
                
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password Now</a>
                </div>
                
                <p style="font-size: 12px; color: #666;">
                  Can't click the button? Copy and paste this link in your browser:<br>
                  ${resetUrl}
                </p>
                
                <p>Best regards,<br>
                <strong>Seizure Management System Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated message from the Seizure Management System.</p>
                <p>Please do not reply to this email. For assistance, contact your system administrator.</p>
                <p>© ${new Date().getFullYear()} Seizure Management System. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Log activity
    const ip = request.headers.get('x-forwarded-for') || request.ip;
    const userAgent = request.headers.get('user-agent');
    await logActivity(user._id, 'password_reset_requested', ip, userAgent, {
      email: user.email,
      resetMethod: 'email_otp'
    });

    // For development, log the OTP to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Password reset OTP for ${email}: ${otp}`);
      console.log(`🔗 Reset URL: ${resetUrl}`);
    }

    const response = NextResponse.json({ 
      message: 'If an account exists with this email, you will receive password reset instructions.',
      otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only return OTP in development
    });

    // Add CORS headers
    const host = request.headers.get('host') || 'localhost:3000';
    const isProduction = process.env.NODE_ENV === 'production';
    
    response.headers.set('Access-Control-Allow-Origin', 
      isProduction ? `http://${host}` : 'http://localhost:3000'
    );
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
    
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request. Please try again later.' },
      { status: 500 }
    );
  }
}