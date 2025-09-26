// app/api/users/route.js
import { NextResponse } from 'next/server';
import User from '@/models/User';
import Office from '@/models/office';
import connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';

export async function GET(request) {
  try {
    // Authenticate user
    const { user } = await authenticate(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    // Connect to database
    await connectDB();

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    // Build query
    let query = {};

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { serviceNo: { $regex: search, $options: 'i' } },
        { rank: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch users with office details populated
    const users = await User.find(query)
      .populate('office', 'name code')
      .select('-password -verificationToken -verificationTokenExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(query);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", details: error.message },
      { status: 500 }
    );
  }
}

// app/api/users/route.js
export async function POST(request) {
  try {
    // Authenticate user
    const { user } = await authenticate(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { email, password, name, serviceNo, rank, office, role } = body;

    // Validate required fields
    if (!email || !password || !name || !serviceNo || !rank || !office || !role) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { serviceNo }]
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          error: existingUser.email === email 
            ? "Email already exists" 
            : "Service number already exists" 
        },
        { status: 400 }
      );
    }

    // Create new user
    const newUser = new User({
      email,
      password,
      name,
      serviceNo: serviceNo.toUpperCase(),
      rank: rank.toUpperCase(),
      office,
      role,
      isVerified: true // Admin created users are automatically verified
    });

    await newUser.save();

    // Return user without sensitive data
    const userWithoutPassword = await User.findById(newUser._id)
      .populate('office', 'name code')
      .select('-password -verificationToken -verificationTokenExpires')
      .lean();

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: "User created successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("Failed to create user:", error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create user", details: error.message },
      { status: 500 }
    );
  }
}