import { NextResponse } from 'next/server';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';
import connectDB from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ error: 'Invalid verification link' }, { status: 400 });
  }
  
  try {
    await connectDB();
    const user = await User.findOne({ 
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }
    
    await User.findOneAndUpdate(
      { verificationToken: token, verificationTokenExpires: { $gt: Date.now() } },
      { isVerified: true, verificationToken: null, verificationTokenExpires: null },
      { new: true }
    );
    
    // Return a success response
    return NextResponse.json({ 
      message: 'Email verified successfully! You can now log in to your account.',
      success: true 
    }, { status: 200 });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Verification failed. Please try again.' 
    }, { status: 500 });
  }
}