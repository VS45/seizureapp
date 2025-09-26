import { NextResponse } from 'next/server';
import User from '@/models/User';
import { sendVerificationEmail } from '@/lib/auth';
import connectDB  from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  const { email } = await request.json();
  
  try {
    await connectDB();
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (user.isVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }
    
    // Generate new verification token
    const verificationToken = uuidv4();
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();
    
    // Send verification email
    await sendVerificationEmail(email, verificationToken);
    
    return NextResponse.json({ 
      message: 'Verification email resent successfully' 
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification email' }, 
      { status: 500 }
    );
  }
}