// app/api/auth/verify-otp/route.js
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/auth';
import User from '@/models/User';
import ResetToken from '@/models/ResetToken';
import connectDB from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
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

    // Find valid reset token
    const resetToken = await ResetToken.findOne({
      email: email.toLowerCase(),
      otp,
      expiresAt: { $gt: new Date() },
      used: false
    }).sort({ createdAt: -1 }); // Get the most recent token

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    resetToken.verified = true;
    await resetToken.save();

    // Log activity
    const ip = request.headers.get('x-forwarded-for') || request.ip;
    const userAgent = request.headers.get('user-agent');
    await logActivity(user._id, 'otp_verified', ip, userAgent, {
      email: user.email,
      resetTokenId: resetToken._id
    });

    const response = NextResponse.json({ 
      message: 'OTP verified successfully',
      token: resetToken.token
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
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP. Please try again later.' },
      { status: 500 }
    );
  }
}