import { NextResponse } from 'next/server';
import  connectDB  from '@/lib/db';
import { authenticate} from '@/lib/auth';
import Distribution from '@/models/Distribution';

export async function POST(request, { params }) {
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

    const { id } = await params;
    const { condition, remarks, nextRenewalDate } = await request.json();

    const distribution = await Distribution.findById(id);
    if (!distribution) {
      return NextResponse.json({ error: 'Distribution not found' }, { status: 404 });
    }

    if (distribution.status !== 'issued' && distribution.status !== 'partial_return') {
      return NextResponse.json(
        { error: 'Cannot renew a returned distribution' },
        { status: 400 }
      );
    }

    // Add renewal record
    distribution.renewalHistory.push({
      renewedAt: new Date(),
      renewedBy: user.id,
      nextRenewalDate: new Date(nextRenewalDate),
      condition,
      remarks
    });

    // Update renewal status and due date
    distribution.renewalStatus = 'renewed';
    distribution.renewalDue = new Date(nextRenewalDate);

    await distribution.save();

    return NextResponse.json({
      success: true,
      message: 'Distribution renewed successfully',
      distribution
    });
  } catch (error) {
    console.error('POST /api/distributions/[id]/renew error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}