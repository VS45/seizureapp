import { NextResponse } from 'next/server';
import  connectDB from '@/lib/db';
import { authenticate, hasPermission } from '@/lib/auth';
import Distribution from '@/models/Distribution';

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
    const status = searchParams.get('status'); // due, overdue, pending
    const format = searchParams.get('format') || 'json'; // json, csv

    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);

    let query = { 
      status: { $in: ['issued', 'partial_return'] } 
    };

    // Filter by renewal status
    if (status === 'due') {
      query.renewalDue = { $lte: sevenDaysFromNow, $gte: now };
      query.renewalStatus = { $in: ['pending', 'due'] };
    } else if (status === 'overdue') {
      query.renewalDue = { $lt: now };
      query.renewalStatus = { $in: ['pending', 'due', 'overdue'] };
    } else if (status === 'pending') {
      query.renewalStatus = 'pending';
    }

    const renewals = await Distribution.find(query)
      .populate('officer', 'serviceNo name rank patrolTeam')
      .populate('armory', 'armoryName armoryCode location')
      .populate('issuedBy', 'name email')
      .sort({ renewalDue: 1 });

    // Calculate statistics
    const stats = {
      total: renewals.length,
      due: renewals.filter(r => r.renewalDue <= sevenDaysFromNow && r.renewalDue >= now).length,
      overdue: renewals.filter(r => r.renewalDue < now).length,
      pending: renewals.filter(r => r.renewalStatus === 'pending').length,
      bySquad: renewals.reduce((acc, renewal) => {
        const squad = renewal.squadName;
        acc[squad] = (acc[squad] || 0) + 1;
        return acc;
      }, {}),
      byArmory: renewals.reduce((acc, renewal) => {
        const armory = renewal.armory.armoryName;
        acc[armory] = (acc[armory] || 0) + 1;
        return acc;
      }, {})
    };

    // Add days until due for each renewal
    const renewalsWithDays = renewals.map(renewal => ({
      ...renewal.toObject(),
      daysUntilDue: Math.ceil((renewal.renewalDue - now) / (1000 * 60 * 60 * 24))
    }));

    const response = {
      stats,
      renewals: renewalsWithDays,
      generatedAt: now
    };

    // CSV export
    if (format === 'csv') {
      const csvHeaders = 'Distribution No,Officer,Rank,Squad,Armory,Issued Date,Renewal Due,Days Until Due,Status\n';
      const csvRows = renewalsWithDays.map(r => 
        `"${r.distributionNo}","${r.officer.name}","${r.officer.rank}","${r.squadName}","${r.armory.armoryName}","${r.dateIssued.toISOString().split('T')[0]}","${r.renewalDue.toISOString().split('T')[0]}","${r.daysUntilDue}","${r.renewalStatus}"`
      ).join('\n');
      
      const csv = csvHeaders + csvRows;
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="renewals-${status || 'all'}-${now.toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/reports/renewals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}