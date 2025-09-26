import { NextResponse } from 'next/server';
import Checkpoint from '@/models/Checkpoint';
import connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';
import Office from '@/models/office';

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

    // If user is not admin, only show their own checkpoints
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

    // Get checkpoints with pagination and populate user info
    const checkpoints = await Checkpoint.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Checkpoint.countDocuments(query);

    return NextResponse.json({
      success: true,
      checkpoints,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch checkpoints:", error);
    return NextResponse.json(
      { error: "Failed to fetch checkpoints", details: error.message },
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
    const { name, description, officeCode } = body;
    const office = await Office.findOne({ code: officeCode })
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Check if checkpoint with same name already exists for this user
    const existingCheckpoint = await Checkpoint.findOne({
      user: user._id,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingCheckpoint) {
      return NextResponse.json(
        { error: "Checkpoint with this name already exists" },
        { status: 400 }
      );
    }

    // Create new checkpoint
    const checkpoint = new Checkpoint({
      user: user._id,
      name,
      description,
      office: office._id,
    });

    await checkpoint.save();

    // Populate user info in the response
    await checkpoint.populate('user', 'name email');

    return NextResponse.json({
      success: true,
      checkpoint,
      message: "Checkpoint created successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("Failed to create checkpoint:", error);
    return NextResponse.json(
      { error: "Failed to create checkpoint", details: error.message },
      { status: 500 }
    );
  }
}