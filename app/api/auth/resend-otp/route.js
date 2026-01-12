// app/api/auth/resend-otp/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { logActivity } from '@/lib/auth';
import User from '@/models/User';
import ResetToken from '@/models/ResetToken';
import connectDB from '@/lib/db';

export const runtime = 'nodejs';

// Reuse the same transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
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
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update existing token or create new one
    const resetToken = await ResetToken.findOneAndUpdate(
      { 
        email: email.toLowerCase(),
        expiresAt: { $gt: new Date() },
        used: false
      },
      {
        $set: {
          otp: newOtp,
          verified: false,
          expiresAt: new Date(Date.now() + 3600000) // Reset to 1 hour
        }
      },
      { new: true, upsert: true }
    );

    // Send email with new OTP
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Seizure Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'New Verification Code - Seizure Management System',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
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
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔄 New Verification Code</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${user.name}</strong>,</p>
                
                <p>As requested, here is your new verification code:</p>
                
                <div class="code">${newOtp}</div>
                
                <p>This code expires in 1 hour.</p>
                
                <p>If you did not request a new code, please ignore this email.</p>
                
                <p>Best regards,<br>
                <strong>Seizure Management System Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated message from the Seizure Management System.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Log activity
    const ip = request.headers.get('x-forwarded-for') || request.ip;
    const userAgent = request.headers.get('user-agent');
    await logActivity(user._id, 'otp_resent', ip, userAgent, {
      email: user.email,
      resetTokenId: resetToken._id
    });

    // For development, log the OTP
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 New OTP for ${email}: ${newOtp}`);
    }

    const response = NextResponse.json({ 
      message: 'New verification code sent successfully',
      otp: process.env.NODE_ENV === 'development' ? newOtp : undefined
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
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification code. Please try again later.' },
      { status: 500 }
    );
  }
}