import { NextResponse } from 'next/server';
import  connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { officerSchema } from '@/lib/validation';
import Officer from '@/models/Officer';
import PatrolTeam from '@/models/PatrolTeam';
import Office from '@/models/office';

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
    const patrolTeam = searchParams.get('patrolTeam') || '';
    const office = searchParams.get('office') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;
    
    let query = {};

    if (search) {
      query.$or = [
        { serviceNo: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { rank: { $regex: search, $options: 'i' } }
      ];
    }

    if (patrolTeam) {
      query.patrolTeam = patrolTeam;
    }

    if (office) {
      query.office = office;
    }

    if (status) {
      query.status = status;
    }

    const [officers, total] = await Promise.all([
      Officer.find(query)
        .populate('office', 'name code')
        .populate('patrolTeam', 'name code')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Officer.countDocuments(query)
    ]);

    return NextResponse.json({
      officers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GET /api/officers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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

    const body = await request.json();
    
    const validationResult = officerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { patrolTeam, office, ...data } = validationResult.data;

    // Verify patrol team and office exist
    const [patrolTeamDoc, officeDoc] = await Promise.all([
      PatrolTeam.findById(patrolTeam),
      Office.findById(office)
    ]);

    if (!patrolTeamDoc) {
      return NextResponse.json({ error: 'Patrol team not found' }, { status: 404 });
    }

    if (!officeDoc) {
      return NextResponse.json({ error: 'Office not found' }, { status: 404 });
    }

    // Create officer
    const officer = new Officer({
      ...data,
      patrolTeam,
      office,
      createdBy: user.id
    });

    await officer.save();

    // Add officer to patrol team members
    patrolTeamDoc.members.push(officer._id);
    await patrolTeamDoc.save();

    await officer.populate('office', 'name code');
    await officer.populate('patrolTeam', 'name code');

    return NextResponse.json(officer, { status: 201 });
  } catch (error) {
    console.error('POST /api/officers error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Service number already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}