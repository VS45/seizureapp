import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';
import Officer from '@/models/Officer';
import Distribution from '@/models/Distribution';
import PatrolTeam from '@/models/PatrolTeam';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await authenticate(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } =await params;

    // Check if user has permission to view this officer
     if (user.role !== "admin" && user.role !== "armourer") {
         return NextResponse.json(
           { error: "Insufficient permissions to access armory data" },
           { status: 403 }
         );
       }

    const officer = await Officer.findById(id)
      .populate('office', 'name code location')
      .populate('patrolTeam', 'name code')
      .populate('createdBy', 'name email');

    if (!officer) {
      return NextResponse.json({ error: 'Officer not found' }, { status: 404 });
    }

    // Get possession history (distributions)
    const distributions = await Distribution.find({ officer: id })
      .populate('armory', 'armoryName armoryCode')
      .populate('issuedBy', 'name email')
      .sort({ dateIssued: -1 });

    // Get current possessions (items not fully returned)
    const currentPossessions = await Distribution.aggregate([
      { $match: { officer: officer._id, status: { $in: ['issued', 'partial_return'] } } },
      { $unwind: '$weaponsIssued' },
      {
        $match: {
          $expr: { $gt: ['$weaponsIssued.quantity', '$weaponsIssued.returnedQuantity'] }
        }
      },
      {
        $project: {
          distributionId: '$_id',
          distributionNo: 1,
          itemType: 'weapon',
          itemSnapshot: '$weaponsIssued.itemSnapshot',
          quantityIssued: '$weaponsIssued.quantity',
          quantityReturned: '$weaponsIssued.returnedQuantity',
          dateIssued: 1,
          renewalDue: 1
        }
      }
    ]);

    const response = {
      officer,
      possessionHistory: distributions,
      currentPossessions
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/officers/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
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

    const { id } =await params;
    const body = await request.json();

    const officer = await Officer.findById(id);
    if (!officer) {
      return NextResponse.json({ error: 'Officer not found' }, { status: 404 });
    }

    // If changing patrol team, update both officer and patrol team
    if (body.patrolTeam && body.patrolTeam !== officer.patrolTeam.toString()) {
      // Remove from old patrol team
      const oldPatrolTeam = await PatrolTeam.findById(officer.patrolTeam);
      if (oldPatrolTeam) {
        oldPatrolTeam.members.pull(officer._id);
        await oldPatrolTeam.save();
      }

      // Add to new patrol team
      const newPatrolTeam = await PatrolTeam.findById(body.patrolTeam);
      if (!newPatrolTeam) {
        return NextResponse.json({ error: 'Patrol team not found' }, { status: 404 });
      }
      newPatrolTeam.members.addToSet(officer._id);
      await newPatrolTeam.save();
    }

    const updatedOfficer = await Officer.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('office', 'name code location')
      .populate('patrolTeam', 'name code')
      .populate('createdBy', 'name email');

    return NextResponse.json(updatedOfficer);
  } catch (error) {
    console.error('PUT /api/officers/[id] error:', error);
    
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

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const user = await authenticate(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can delete officers
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } =await params;
    const officer = await Officer.findById(id);

    if (!officer) {
      return NextResponse.json({ error: 'Officer not found' }, { status: 404 });
    }

    // Check if officer has active distributions
    const activeDistributions = await Distribution.countDocuments({
      officer: id,
      status: { $in: ['issued', 'partial_return'] }
    });

    if (activeDistributions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete officer with active distributions' },
        { status: 400 }
      );
    }

    // Remove officer from patrol team
    if (officer.patrolTeam) {
      await PatrolTeam.findByIdAndUpdate(
        officer.patrolTeam,
        { $pull: { members: officer._id } }
      );
    }

    await Officer.findByIdAndDelete(id);

    return NextResponse.json({ 
      success: true,
      message: 'Officer deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /api/officers/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}