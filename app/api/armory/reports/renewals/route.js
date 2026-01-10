import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';
import Distribution from '@/models/Distribution';


export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Find distributions that are due for renewal
    const renewals = await Distribution.find({
      status: 'issued',
      expectedReturnDate: { $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) }, // Due in next 7 days
      createdAt: { $gte: startDate }
    })
      .populate('officer', 'serviceNo name rank patrolTeam')
      .populate('armory', 'armoryName armoryCode location')
      .sort({ expectedReturnDate: 1 })
      .lean();

    return NextResponse.json({
      report: {
        period,
        startDate,
        endDate: now,
        renewals,
        summary: {
          totalRenewals: renewals.length,
          dueThisWeek: renewals.filter(r => 
            new Date(r.expectedReturnDate) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          ).length,
          overdue: renewals.filter(r => new Date(r.expectedReturnDate) < now).length
        }
      },
      success: true
    });

  } catch (error) {
    console.error('GET /api/reports/renewals error:', error);
    return NextResponse.json(
      { error: 'Failed to generate renewals report' },
      { status: 500 }
    );
  }
}