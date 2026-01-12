// app/api/auth/reset-password/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/auth';
import User from '@/models/User';
import ResetToken from '@/models/ResetToken';
import connectDB from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { email, newPassword, token } = await request.json();

    // Validate input
    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
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
      $or: [
        { token: token || '' }, // For direct link access
        { verified: true } // For OTP flow
      ],
      expiresAt: { $gt: new Date() },
      used: false
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset session. Please request a new reset link.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    // Mark reset token as used
    resetToken.used = true;
    await resetToken.save();

    // Log activity
    const ip = request.headers.get('x-forwarded-for') || request.ip;
    const userAgent = request.headers.get('user-agent');
    await logActivity(user._id, 'password_reset_completed', ip, userAgent, {
      email: user.email,
      resetMethod: token ? 'direct_link' : 'otp_flow',
      resetTokenId: resetToken._id
    });

    // Clean up old reset tokens for this user
    await ResetToken.deleteMany({
      userId: user._id,
      _id: { $ne: resetToken._id }
    });

    const response = NextResponse.json({ 
      message: 'Password reset successfully. You can now login with your new password.'
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
      { error: 'Failed to reset password. Please try again later.' },
      { status: 500 }
    );
  }
}