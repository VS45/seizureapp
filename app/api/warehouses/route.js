import { NextResponse } from 'next/server';
import Warehouse from '@/models/Warehouse';
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
    
    // If user is not admin, only show their own warehouses
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

    // Get warehouses with pagination and populate user info
    const warehouses = await Warehouse.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Warehouse.countDocuments(query);

    return NextResponse.json({
      success: true,
      warehouses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch warehouses:", error);
    return NextResponse.json(
      { error: "Failed to fetch warehouses", details: error.message },
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
    const { name, description,officeCode } = body;

        const office = await Office.findOne({ code: officeCode })
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Check if warehouse with same name already exists for this user
    const existingWarehouse = await Warehouse.findOne({
      user: user._id,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingWarehouse) {
      return NextResponse.json(
        { error: "Warehouse with this name already exists" },
        { status: 400 }
      );
    }

    // Create new warehouse
    const warehouse = new Warehouse({
      user: user._id,
      name,
      description,
      office:office._id
    });

    await warehouse.save();

    // Populate user info in the response
    await warehouse.populate('user', 'name email');

    return NextResponse.json({
      success: true,
      warehouse,
      message: "Warehouse created successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("Failed to create warehouse:", error);
    return NextResponse.json(
      { error: "Failed to create warehouse", details: error.message },
      { status: 500 }
    );
  }
}