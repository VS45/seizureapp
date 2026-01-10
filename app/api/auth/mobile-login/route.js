// app/api/auth/mobile-login/route.js (New file)
import { NextResponse } from 'next/server';
import { generateToken, logActivity } from '@/lib/auth';
import User from '@/models/User';
import connectDB from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request) {
  const { email, password } = await request.json();
  
  try {
    await connectDB();
    const user = await User.findOne({ email });
    console.log(user);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    if (!user.isVerified) {
      return NextResponse.json({ error: 'Account not verified' }, { status: 401 });
    }
    
    const isMatch = await user.comparePassword(password);
    console.log(isMatch);
      console.log(password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    // Generate token with error handling
    let token;
    try {
      token = generateToken(user);
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      return NextResponse.json(
        { error: 'Authentication error' }, 
        { status: 500 }
      );
    }
    
    // Log activity
    const ip = request.headers.get('x-forwarded-for') || request.ip;
    const userAgent = request.headers.get('user-agent');
    await logActivity(user._id, 'mobile-login', ip, userAgent);
    
    await user.updateActivity();
    
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      office: user.office ? {
        id: user.office._id,
        name: user.office.name,
        code: user.office.code
      } : null
    };
    
    // Return response with token for mobile
    return NextResponse.json({ 
      message: 'Login successful',
      user: userData,
      token: token,
      expiresIn: 2 * 60 * 60 // 2 hours in seconds
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Server error. Please try again later.' }, 
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}