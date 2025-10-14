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
    await logActivity(user._id, 'login', ip, userAgent);
    
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
    
    const response = NextResponse.json({ 
      message: 'Login successful',
      user: userData
    });
    
    // Get the host from request headers for dynamic configuration
    const host = request.headers.get('host') || 'localhost:3000';
    const isProduction = process.env.NODE_ENV === 'production';
    const isIPAddress = host.match(/^\d+\.\d+\.\d+\.\d+(:\d+)?$/);
    
    // Set cookie - relaxed settings for IP address
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isProduction && !isIPAddress, // Don't force HTTPS for IP addresses
      sameSite: 'lax', // Use 'lax' instead of 'strict' for IP addresses
      maxAge: 2 * 60 * 60,
      path: '/',
      // No domain setting for IP addresses
    });
    
    // Add CORS headers for IP address
    response.headers.set('Access-Control-Allow-Origin', 
      isProduction ? `http://${host}` : 'http://localhost:3000'
    );
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Server error. Please try again later.' }, 
      { status: 500 }
    );
  }
}