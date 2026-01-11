import { NextResponse } from 'next/server';
//import { connectDB } from '@/lib/db';
import { authenticate} from '@/lib/auth';
import { armorySchema } from '@/lib/validation';
import Armory from '@/models/Armory';
import Office from '@/models/office';
import connectDB from '@/lib/db';

export async function GET(request) {
  try {
    await connectDB();
    const {user} = await authenticate(request);
    
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
    const status = searchParams.get('status') || '';
    const unit = searchParams.get('unit') || '';

    const skip = (page - 1) * limit;
    
    let query = {};
    
    // Non-admins can only see armories from their unit
    if (user.role !== 'admin') {
      query.unit = user.unit;
    }

    if (search) {
      query.$or = [
        { armoryName: { $regex: search, $options: 'i' } },
        { armoryCode: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (unit) {
      query.unit = unit;
    }

    const [armories, total] = await Promise.all([
      Armory.find(query)
        .populate('office', 'name code location')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Armory.countDocuments(query)
    ]);

    return NextResponse.json({
      armories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GET /api/armories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { user } = await authenticate(request);
    console.log('Authenticated user:', user);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "armourer") {
      return NextResponse.json(
        { error: "Insufficient permissions to create armory" },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('Received armory data:', body);
    
    // Transform office object to string (ObjectId) for validation
    const transformedBody = {
      ...body,
      office: body.office?._id || body.office // Use _id if object, otherwise use string
    };
    
    console.log('Transformed data for validation:', transformedBody);
    
    const validationResult = armorySchema.safeParse(transformedBody);
    console.log('Validation result:', validationResult);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Verify office exists
    const office = await Office.findById(transformedBody.office);
    if (!office) {
      return NextResponse.json({ error: 'Office not found' }, { status: 404 });
    }

    // Generate reference ID (use provided one or generate new)
   // const referenceID = body.referenceID || `AR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Create armory with defaults for required fields
    const armory = new Armory({
      ...validationResult.data,
      referenceID: body.referenceID, 
      office: office._id,
      unit: validationResult.data.unit || user.unit, // Use provided unit or user's unit
      // Provide default current custodian (could be the creator)
      currentCustodian: {
        serviceNo: user.serviceNo || 'N/A', // Provide default or from user
        rank: user.rank || 'Officer', // Provide default or from user
        name: user.name,
        takeoverDate: new Date()
      },
      createdBy: user._id,
      createdByName: body.createdByName || user.name,
      // Optional: Store office details
      officeDetails: {
        name: office.name,
        code: office.code,
        location: office.location || ''
      },
      // Set default status if not provided
      status: validationResult.data.status || 'active',
      // Initialize empty arrays for optional fields
      weapons: validationResult.data.weapons || [],
      ammunition: validationResult.data.ammunition || [],
      equipment: validationResult.data.equipment || [],
      otherItems: [],
      accessCodes: validationResult.data.accessCodes || [],
      comments: validationResult.data.comments || [],
      // Set default security level
      securityLevel: 'medium'
    });

    await armory.save();
    return NextResponse.json(armory, { status: 201 });
  } catch (error) {
    console.error('POST /api/armories error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Armory code already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}