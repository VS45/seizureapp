import { NextResponse } from 'next/server';
import  connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { officeSchema } from '@/lib/validation';
import Office from '@/models/office';

// GET /api/offices - Get paginated offices with filtering
export async function GET(request) {
  console.log('Received GET /api/offices request');
  try {
    // Authenticate user
    const {user} = await authenticate(request);
    console.log('Authenticated user:', user);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permissions
      if (user.role !== "admin" && user.role !== "armourer") {
             return NextResponse.json(
               { error: "Insufficient permissions to access armory data" },
               { status: 403 }
             );
           }

    await connectDB();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';

    // Build filter object
    const filter = {};

    // Search across multiple fields
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries in parallel for better performance
    const [offices, total] = await Promise.all([
      Office.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Office.countDocuments(filter)
    ]);

    // Calculate pagination metadata
    const pages = Math.ceil(total / limit);
    const hasNext = page < pages;
    const hasPrev = page > 1;

    // Transform response data
    const transformedOffices = offices.map(office => ({
      ...office,
      _id: office._id.toString(),
      createdAt: office.createdAt?.toISOString(),
      updatedAt: office.updatedAt?.toISOString()
    }));

    return NextResponse.json({
      offices: transformedOffices,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext,
        hasPrev
      },
      success: true
    });

  } catch (error) {
    console.error('GET /api/offices error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offices' },
      { status: 500 }
    );
  }
}

// POST /api/offices - Create a new office
export async function POST(request) {
  try {
    // Authenticate user
    const {user} = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permissions
     if (user.role !== "admin" && user.role !== "armourer") {
            return NextResponse.json(
              { error: "Insufficient permissions to access armory data" },
              { status: 403 }
            );
          }

    await connectDB();

    // Parse and validate request body
    const body = await request.json();
    
    const validationResult = officeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid office data', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const officeData = validationResult.data;

    // Check for duplicate office name (since name is unique in schema)
    const existingOffice = await Office.findOne({ 
      $or: [
        { name: officeData.name },
        { code: officeData.code }
      ]
    });
    
    if (existingOffice) {
      const field = existingOffice.name === officeData.name ? 'name' : 'code';
      return NextResponse.json(
        { error: `Office ${field} already exists` },
        { status: 409 }
      );
    }

    // Create new office
    const newOffice = new Office(officeData);

    // Save to database
    const savedOffice = await newOffice.save();

    // Transform response
    const officeResponse = {
      ...savedOffice.toObject(),
      _id: savedOffice._id.toString(),
      createdAt: savedOffice.createdAt.toISOString(),
      updatedAt: savedOffice.updatedAt.toISOString()
    };

    return NextResponse.json(
      { 
        office: officeResponse,
        success: true,
        message: 'Office created successfully'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST /api/offices error:', error);
    
    // Handle specific error cases
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      const field = error.keyPattern?.name ? 'name' : 'code';
      return NextResponse.json(
        { error: `Office ${field} already exists` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create office' },
      { status: 500 }
    );
  }
}