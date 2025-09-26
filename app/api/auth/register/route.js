import { NextResponse } from 'next/server';
import User from '@/models/User';
import Office from '@/models/office';
import { sendVerificationEmail } from '@/lib/auth';
import connectDB from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  const { email, password, name, serviceNo, rank, officeCode, role } = await request.json();
  
  try {
    await connectDB();
    
    // Check if user exists by email
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }
    
    // Check if service number already exists
    const existingUserByServiceNo = await User.findOne({ serviceNo });
    if (existingUserByServiceNo) {
      return NextResponse.json({ error: 'Service number already in use' }, { status: 400 });
    }
    
    // Find the office by code
    const office = await Office.findOne({ code: officeCode });
    if (!office) {
      return NextResponse.json({ error: 'Invalid office code' }, { status: 400 });
    }
    
    // Create verification token
    const verificationToken = uuidv4();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Create new user
    const user = new User({
      email,
      password,
      name,
      serviceNo,
      rank,
      office: office._id, // Store reference to office
      role,
      verificationToken,
      verificationTokenExpires
    });
    
    await user.save();
    
    // Send verification email
    await sendVerificationEmail(email, verificationToken);
    
    return NextResponse.json({ 
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        email: user.email,
        name: user.name,
        serviceNo: user.serviceNo,
        rank: user.rank,
        role: user.role,
        office: {
          name: office.name,
          code: office.code
        }
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' }, 
      { status: 500 }
    );
  }
}