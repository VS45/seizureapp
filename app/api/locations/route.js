import { NextResponse } from 'next/server';
import Location from '@/models/Location';
import connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth'; // Assuming you have an authentication utility

export async function GET(request) {
  try {
    // Authenticate user
    const { user } = await authenticate(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Connect to database
    await connectDB();

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    // Build query based on user role
    let query = {};
    
    // If user is not admin, only show their own locations
    if (user.role !== "admin") {
      query.user = user._id;
    }

    // Add search functionality if search parameter is provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get locations with pagination and populate user info
    const locations = await Location.find(query)
      .populate('user', 'name email') // Populate user details if needed
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Location.countDocuments(query);

    return NextResponse.json({
      success: true,
      locations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Authenticate user
    const { user } = await authenticate(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { name, description } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Create new location
    const location = new Location({
      user: user._id,
      name,
      description
    });

    await location.save();

    // Populate user info in the response
    await location.populate('user', 'name email');

    return NextResponse.json({
      success: true,
      location,
      message: "Location created successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("Failed to create location:", error);
    return NextResponse.json(
      { error: "Failed to create location", details: error.message },
      { status: 500 }
    );
  }
}