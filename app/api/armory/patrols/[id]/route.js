import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { authenticate, hasPermission } from '@/lib/auth';
import PatrolTeam from '@/models/PatrolTeam';
import Office from '@/models/office';

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const user = await authenticate(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use permission system instead of hardcoded role check
    if (user.role !== "admin" && user.role !== "armourer") {
           return NextResponse.json(
             { error: "Insufficient permissions to access armory data" },
             { status: 403 }
           );
         }
    const { id } = await params;
    const body = await request.json();

    const patrolTeam = await PatrolTeam.findById(id);
    if (!patrolTeam) {
      return NextResponse.json({ error: 'Patrol team not found' }, { status: 404 });
    }

    // Verify office exists if being updated
    if (body.office) {
      const office = await Office.findById(body.office);
      if (!office) {
        return NextResponse.json({ error: 'Office not found' }, { status: 404 });
      }
    }

    const updatedPatrolTeam = await PatrolTeam.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('office', 'name code') // Removed 'location'
      .populate('members', 'serviceNo name rank')
      .populate('createdBy', 'name email');

    // Transform the response
    const transformedPatrolTeam = {
      ...updatedPatrolTeam.toObject(),
      _id: updatedPatrolTeam._id.toString(),
      office: updatedPatrolTeam.office ? {
        _id: updatedPatrolTeam.office._id.toString(),
        name: updatedPatrolTeam.office.name,
        code: updatedPatrolTeam.office.code
        // Removed location field
      } : null,
      createdBy: updatedPatrolTeam.createdBy ? {
        _id: updatedPatrolTeam.createdBy._id.toString(),
        name: updatedPatrolTeam.createdBy.name,
        email: updatedPatrolTeam.createdBy.email
      } : null,
      members: updatedPatrolTeam.members?.map(member => ({
        ...member,
        _id: member._id.toString()
      })) || [],
      createdAt: updatedPatrolTeam.createdAt?.toISOString(),
      updatedAt: updatedPatrolTeam.updatedAt?.toISOString()
    };

    return NextResponse.json({
      patrol: transformedPatrolTeam,
      success: true,
      message: 'Patrol team updated successfully'
    });
  } catch (error) {
    console.error('PUT /api/patrols/[id] error:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Patrol team code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const user = await authenticate(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use permission system instead of hardcoded role check
    if (!hasPermission(user, 'delete', 'patrols')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params; 
    const patrolTeam = await PatrolTeam.findById(id);

    if (!patrolTeam) {
      return NextResponse.json({ error: 'Patrol team not found' }, { status: 404 });
    }

    // Check if patrol team has members
    if (patrolTeam.members && patrolTeam.members.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete patrol team with active members' },
        { status: 400 }
      );
    }

    await PatrolTeam.findByIdAndDelete(id);

    return NextResponse.json({ 
      success: true,
      message: 'Patrol team deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /api/patrols/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}