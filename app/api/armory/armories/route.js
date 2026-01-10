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
    const user = await authenticate(request);
    
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
    const user = await authenticate(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, 'create', 'armories')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    const validationResult = armorySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Verify office exists and belongs to same unit for non-admins
    const office = await Office.findById(body.office);
    if (!office) {
      return NextResponse.json({ error: 'Office not found' }, { status: 404 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Office does not belong to your unit' },
        { status: 403 }
      );
    }

    // Generate reference ID
    const referenceID = `AR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const armory = new Armory({
      ...validationResult.data,
      referenceID,
      unit: user.unit,
      createdBy: user.id
    });

    await armory.save();
    await armory.populate('office', 'name code location');

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}