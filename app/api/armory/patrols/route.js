import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { patrolTeamSchema } from '@/lib/validation';
import PatrolTeam from '@/models/PatrolTeam';
import Office from '@/models/office';

export async function GET(request) {
  try {
    await connectDB();
    const user = await authenticate(request);
    console.log('Authenticated user:', user);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

     if (user.role !== "admin" && user.role !== "armourer") {
            return NextResponse.json(
              { error: "Insufficient permissions to access armory data" },
              { status: 403 }
            );
          }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const office = searchParams.get('office') || '';

    const skip = (page - 1) * limit;
    
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    if (office) {
      query.office = office;
    }

    const [patrols, total] = await Promise.all([
      PatrolTeam.find(query)
        .populate('office', 'name code') // Removed 'location' field
        .populate('members', 'serviceNo name rank')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(), // Added lean() for better performance
      PatrolTeam.countDocuments(query)
    ]);

    // Transform the response to handle ObjectId serialization
    const transformedPatrols = patrols.map(patrol => ({
      ...patrol,
      _id: patrol._id.toString(),
      office: patrol.office ? {
        _id: patrol.office._id.toString(),
        name: patrol.office.name,
        code: patrol.office.code
        // Removed location field
      } : null,
      createdBy: patrol.createdBy ? {
        _id: patrol.createdBy._id.toString(),
        name: patrol.createdBy.name,
        email: patrol.createdBy.email
      } : null,
      members: patrol.members?.map(member => ({
        ...member,
        _id: member._id.toString()
      })) || [],
      createdAt: patrol.createdAt?.toISOString(),
      updatedAt: patrol.updatedAt?.toISOString()
    }));

    return NextResponse.json({
      patrols: transformedPatrols,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      success: true
    });
  } catch (error) {
    console.error('GET /api/patrols error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const user = await authenticate(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the permission system instead of hardcoded role check
    if (user.role !== "admin" && user.role !== "armourer") {
           return NextResponse.json(
             { error: "Insufficient permissions to access armory data" },
             { status: 403 }
           );
         }

    const body = await request.json();
    
    const validationResult = patrolTeamSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { office, ...data } = validationResult.data;

    // Verify office exists
    const officeDoc = await Office.findById(office);
    if (!officeDoc) {
      return NextResponse.json({ error: 'Office not found' }, { status: 404 });
    }

    const patrolTeam = new PatrolTeam({
      ...data,
      office,
      createdBy: user.id
    });

    await patrolTeam.save();
    
    // Populate the office field for response
    await patrolTeam.populate('office', 'name code'); // Removed 'location'

    // Transform the response
    const patrolResponse = {
      ...patrolTeam.toObject(),
      _id: patrolTeam._id.toString(),
      office: {
        _id: patrolTeam.office._id.toString(),
        name: patrolTeam.office.name,
        code: patrolTeam.office.code
        // Removed location field
      },
      createdAt: patrolTeam.createdAt.toISOString(),
      updatedAt: patrolTeam.updatedAt.toISOString()
    };

    return NextResponse.json(
      { 
        patrol: patrolResponse,
        success: true,
        message: 'Patrol team created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/patrols error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Patrol team code already exists' },
        { status: 409 } // Changed to 409 Conflict for consistency
      );
    }

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}