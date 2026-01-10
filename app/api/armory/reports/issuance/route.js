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
    const groupBy = searchParams.get('groupBy') || 'squad';

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
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const distributions = await Distribution.find({
      createdAt: { $gte: startDate, $lte: now }
    })
      .populate('officer', 'serviceNo name rank patrolTeam office')
      .populate('armory', 'armoryName location')
      .sort({ createdAt: -1 })
      .lean();

    // Group data based on groupBy parameter
    const groupedData = groupIssuanceData(distributions, groupBy);

    return NextResponse.json({
      report: {
        period,
        groupBy,
        startDate,
        endDate: now,
        data: groupedData,
        summary: {
          totalIssuances: distributions.length,
          totalItems: distributions.reduce((sum, dist) => 
            sum + dist.weapons.reduce((wSum, w) => wSum + w.quantity, 0), 0
          ),
          uniqueSquads: new Set(distributions.map(d => d.squadName)).size,
          uniqueOfficers: new Set(distributions.map(d => d.officer?._id).filter(Boolean)).size
        }
      },
      success: true
    });

  } catch (error) {
    console.error('GET /api/reports/issuance error:', error);
    return NextResponse.json(
      { error: 'Failed to generate issuance report' },
      { status: 500 }
    );
  }
}

function groupIssuanceData(distributions, groupBy) {
  const grouped = {};

  distributions.forEach(dist => {
    let key;

    switch (groupBy) {
      case 'squad':
        key = dist.squadName || 'Unknown Squad';
        break;
      case 'officer':
        key = dist.officer ? `${dist.officer.rank} ${dist.officer.name}` : 'Unknown Officer';
        break;
      case 'armory':
        key = dist.armory ? dist.armory.armoryName : 'Unknown Armory';
        break;
      case 'day':
        key = new Date(dist.createdAt).toLocaleDateString();
        break;
      case 'week':
        const weekStart = new Date(dist.createdAt);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        key = weekStart.toLocaleDateString();
        break;
      default:
        key = dist.squadName || 'Unknown Squad';
    }

    if (!grouped[key]) {
      grouped[key] = {
        key,
        issuances: 0,
        items: 0,
        weapons: {}
      };
    }

    grouped[key].issuances += 1;
    
    dist.weapons.forEach(weapon => {
      grouped[key].items += weapon.quantity;
      
      if (!grouped[key].weapons[weapon.weaponType]) {
        grouped[key].weapons[weapon.weaponType] = 0;
      }
      grouped[key].weapons[weapon.weaponType] += weapon.quantity;
    });
  });

  return Object.values(grouped).map(group => ({
    ...group,
    weapons: Object.entries(group.weapons).map(([weapon, count]) => ({
      weapon,
      count
    }))
  }));
}