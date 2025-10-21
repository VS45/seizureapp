import { NextResponse } from 'next/server';
import Armory from '@/models/Armory';
import connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';

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
    const status = searchParams.get("status") || "";
    const unit = searchParams.get("unit") || "";

    // Build query based on user role and permissions
    let query = {};

    // If user is not admin/armory, restrict access
    if (user.role !== "admin" && user.role !== "armourer") {
      return NextResponse.json(
        { error: "Insufficient permissions to access armory data" },
        { status: 403 }
      );
    }

    // If user has specific unit assignment, filter by unit
    if (user.unit && user.role !== "admin") {
      query.unit = user.unit;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { referenceID: { $regex: search, $options: 'i' } },
        { armoryName: { $regex: search, $options: 'i' } },
        { armoryCode: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { "currentCustodian.name": { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add unit filter
    if (unit && user.role === "admin") {
      query.unit = unit;
    }

    // Get armories with pagination and populate user info
    const armories = await Armory.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Armory.countDocuments(query);

    return NextResponse.json({
      success: true,
      armories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch armories:", error);
    return NextResponse.json(
      { error: "Failed to fetch armories", details: error.message },
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

    // Check if user has permission to create armories
    if (user.role !== "admin" && user.role !== "armourer") {
      return NextResponse.json(
        { error: "Insufficient permissions to create armories" },
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { 
      armoryName, 
      armoryCode, 
      location, 
      unit, 
      securityLevel,
      weapons,
      ammunition,
      equipment,
      otherItems,
      currentCustodian
    } = body;

    // Validate required fields
    if (!armoryName || !armoryCode || !location || !unit) {
      return NextResponse.json(
        { error: "Armory name, code, location, and unit are required" },
        { status: 400 }
      );
    }

    // Validate current custodian
    if (!currentCustodian || !currentCustodian.serviceNo || !currentCustodian.rank || !currentCustodian.name) {
      return NextResponse.json(
        { error: "Current custodian details (service number, rank, and name) are required" },
        { status: 400 }
      );
    }

    // Check if armory with same name or code already exists
    const existingArmory = await Armory.findOne({
      $or: [
        { armoryName: { $regex: new RegExp(`^${armoryName}$`, 'i') } },
        { armoryCode: { $regex: new RegExp(`^${armoryCode}$`, 'i') } }
      ]
    });

    if (existingArmory) {
      return NextResponse.json(
        { error: "Armory with this name or code already exists" },
        { status: 400 }
      );
    }

    // Generate reference ID
    const timestamp = Date.now().toString().slice(-6);
    const referenceID = `ARM-${timestamp}`;

    // Create new armory
    const armory = new Armory({
      referenceID,
      armoryName,
      armoryCode,
      location,
      unit,
      securityLevel: securityLevel || 'medium',
      weapons: weapons || [],
      ammunition: ammunition || [],
      equipment: equipment || [],
      otherItems: otherItems || [],
      currentCustodian: {
        ...currentCustodian,
        takeoverDate: new Date()
      },
      handoverHistory: [{
        serviceNo: currentCustodian.serviceNo,
        rank: currentCustodian.rank,
        name: currentCustodian.name,
        action: 'taking_over',
        date: new Date(),
        performedBy: user._id
      }],
      createdBy: user._id,
      createdByName: user.name,
      status: 'active'
    });

    await armory.save();

    // Populate the created armory for response
    await armory.populate('createdBy', 'name email');

    return NextResponse.json({
      success: true,
      armory,
      message: "Armory created successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("Failed to create armory:", error);
    return NextResponse.json(
      { error: "Failed to create armory", details: error.message },
      { status: 500 }
    );
  }
}