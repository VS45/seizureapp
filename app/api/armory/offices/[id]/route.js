import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { authenticate, hasPermission } from '@/lib/auth';
import { officeSchema } from '@/lib/validation';
import Office from '@/models/office';

// =========================================================
// GET /api/offices/[id]
// Fetch single office by ID
// =========================================================
export async function GET(request, { params }) {
  try {
    await connectDB();

    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, 'read', 'offices')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } =await params;
    const office = await Office.findById(id); // Removed populate since no createdBy field

    if (!office) {
      return NextResponse.json({ error: 'Office not found' }, { status: 404 });
    }

    // Transform the response
    const officeResponse = {
      ...office.toObject(),
      _id: office._id.toString(),
      createdAt: office.createdAt.toISOString(),
      updatedAt: office.updatedAt.toISOString()
    };

    return NextResponse.json({ 
      success: true, 
      office: officeResponse 
    });
  } catch (error) {
    console.error('GET /api/offices/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// =========================================================
// PUT /api/offices/[id]
// Update office details
// =========================================================
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, 'update', 'offices')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } =await params;
    const body = await request.json();

    // Validate using the schema
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

    const { name, code } = validationResult.data;

    // Check for duplicate code (if code changed)
    const existingOffice = await Office.findOne({ 
      $or: [
        { code, _id: { $ne: id } },
        { name, _id: { $ne: id } }
      ]
    });

    if (existingOffice) {
      const field = existingOffice.code === code ? 'code' : 'name';
      return NextResponse.json(
        { error: `Office ${field} already exists` },
        { status: 409 }
      );
    }

    const updatedOffice = await Office.findByIdAndUpdate(
      id,
      { name, code },
      { new: true, runValidators: true }
    );

    if (!updatedOffice) {
      return NextResponse.json({ error: 'Office not found' }, { status: 404 });
    }

    // Transform the response
    const officeResponse = {
      ...updatedOffice.toObject(),
      _id: updatedOffice._id.toString(),
      createdAt: updatedOffice.createdAt.toISOString(),
      updatedAt: updatedOffice.updatedAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      office: officeResponse,
      message: 'Office updated successfully'
    });
  } catch (error) {
    console.error('PUT /api/offices/[id] error:', error);
    
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
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE /api/offices/[id]
// Delete an office record
// =========================================================
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, 'delete', 'offices')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    
    // Check if office is being used by any patrol teams
    const PatrolTeam = (await import('@/models/PatrolTeam')).default;
    const patrolTeamsUsingOffice = await PatrolTeam.countDocuments({ office: id });
    
    if (patrolTeamsUsingOffice > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete office. It is being used by ${patrolTeamsUsingOffice} patrol team(s).` 
        },
        { status: 400 }
      );
    }

    const office = await Office.findByIdAndDelete(id);

    if (!office) {
      return NextResponse.json({ error: 'Office not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Office "${office.name}" deleted successfully`
    });
  } catch (error) {
    console.error('DELETE /api/offices/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}