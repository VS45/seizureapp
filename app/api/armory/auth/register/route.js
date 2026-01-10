import { NextResponse } from 'next/server';
import connectDB  from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    await connectDB();

    const { name, email, password, role, unit, phone } = await request.json();

    // Validate required fields
    if (!name || !email || !password || !role || !unit) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Validate role (prevent self-assigning admin role)
    const allowedRoles = ['user', 'officer', 'armourer'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role selected' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // For the first user, check if we should make them admin
    const userCount = await User.countDocuments();
    const finalRole = userCount === 0 ? 'admin' : role;

    // Create new user - don't set createdBy for self-registered users
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: finalRole,
      unit: unit.trim(),
      phone: phone ? phone.trim() : '',
      isActive: true
      // Omit createdBy field for self-registration
    });

    await user.save();

    // Return user without password
    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      unit: user.unit,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: userResponse
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}