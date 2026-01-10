import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { createToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create token
    const token = createToken(user._id.toString());

    const response = NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        office: user.office?.toString(),
        unit: user.unit
      }
    });
     // Get the host from request headers for dynamic configuration
    const host = request.headers.get('host') || 'localhost:3000';
    const isProduction = process.env.NODE_ENV === 'production';
    const isIPAddress = host.match(/^\d+\.\d+\.\d+\.\d+(:\d+)?$/);
    
    // Set cookie - relaxed settings for IP address
    response.cookies.set('auth-token', token, {
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
    console.error('POST /api/auth/login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}