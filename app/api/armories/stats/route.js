import { NextResponse } from 'next/server';
import Armory from '@/models/Armory';
import connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';

export async function GET(request) {
  try {
    // Authenticate user
    const { user } = await authenticate(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check permissions
    if (user.role !== "admin" && user.role !== "armourer") {
      return NextResponse.json(
        { error: "Insufficient permissions to access armory statistics" },
        { status: 403 }
      );
    }

    await connectDB();

    // Build query based on user permissions
    let query = {};
    if (user.role !== "admin" && user.unit) {
      query.unit = user.unit;
    }
    
    const armories = await Armory.find(query);
    
    const stats = {
      totalArmories: armories.length,
      totalWeapons: armories.reduce((total, armory) => total + (armory.totalWeapons || 0), 0),
      serviceableWeapons: armories.reduce((total, armory) => total + (armory.serviceableWeapons || 0), 0),
      unserviceableWeapons: armories.reduce((total, armory) => {
        const unserviceable = armory.weapons
          .filter(w => w.condition === 'unserviceable')
          .reduce((sum, w) => sum + w.quantity, 0);
        return total + unserviceable;
      }, 0),
      missingWeapons: armories.reduce((total, armory) => {
        const missing = armory.weapons
          .filter(w => w.condition === 'missing')
          .reduce((sum, w) => sum + w.quantity, 0);
        return total + missing;
      }, 0),
      totalAmmunition: armories.reduce((total, armory) => total + (armory.totalAmmunition || 0), 0),
      pendingAudits: armories.filter(a => a.status === 'under_audit').length,
      highSecurityArmories: armories.filter(a => a.securityLevel === 'high' || a.securityLevel === 'maximum').length
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Failed to fetch armory statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch armory statistics", details: error.message },
      { status: 500 }
    );
  }
}