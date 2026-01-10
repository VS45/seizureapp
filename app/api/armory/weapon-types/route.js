// app/api/armory/weapon-types/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { authenticate, hasPermission } from '@/lib/auth';
import Armory from '@/models/Armory'; // Your Armory model
import Weapon from '@/models/Weapon'; // You'll need to create this for weapon master data

export async function GET(request) {
  try {
    await connectDB();
    
    // Authenticate the user
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
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const includeStats = searchParams.get('includeStats') === 'true';
    const armoryId = searchParams.get('armoryId'); // Optional: filter by specific armory
    
    // Build base query for weapon types
    let weaponTypesQuery = {};
    
    if (search) {
      weaponTypesQuery.$or = [
        { weaponType: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      weaponTypesQuery.category = category;
    }

    // First, try to get weapon types from Weapon master collection if it exists
    let weaponTypes = [];
    let weaponMasterData = {};
    
    try {
      // Check if Weapon model exists and has data
      const weaponMaster = await Weapon?.find(weaponTypesQuery)
        .select('weaponType manufacturer category caliber description specifications')
        .sort({ weaponType: 1 })
        .lean();
      
      if (weaponMaster && weaponMaster.length > 0) {
        weaponTypes = weaponMaster;
        // Create a map for quick lookup
        weaponMasterData = weaponMaster.reduce((acc, weapon) => {
          acc[weapon.weaponType] = weapon;
          return acc;
        }, {});
      }
    } catch (error) {
      console.log('Weapon master collection not available, using armory data');
    }

    // If no weapon master data, extract from existing armories
    if (weaponTypes.length === 0) {
      // Get distinct weapon types from all armories
      const distinctWeaponTypes = await Armory.aggregate([
        { $unwind: '$weapons' },
        { $group: { _id: '$weapons.weaponType' } },
        { $sort: { _id: 1 } }
      ]);
      
      weaponTypes = distinctWeaponTypes.map(item => ({
        weaponType: item._id,
        manufacturer: ''
      }));
    }

    // If we need to include statistics (available quantities, etc.)
    let weaponTypesWithStats = weaponTypes;
    
    if (includeStats) {
      // Build aggregation pipeline to get weapon statistics
      const matchStage = armoryId ? { $match: { _id: armoryId } } : { $match: {} };
      
      const weaponStats = await Armory.aggregate([
        matchStage,
        { $unwind: '$weapons' },
        {
          $group: {
            _id: '$weapons.weaponType',
            totalQuantity: { $sum: '$weapons.quantity' },
            serviceableQuantity: {
              $sum: {
                $cond: [{ $eq: ['$weapons.condition', 'serviceable'] }, '$weapons.quantity', 0]
              }
            },
            unserviceableQuantity: {
              $sum: {
                $cond: [{ $eq: ['$weapons.condition', 'unserviceable'] }, '$weapons.quantity', 0]
              }
            },
            underMaintenanceQuantity: {
              $sum: {
                $cond: [{ $eq: ['$weapons.condition', 'under_maintenance'] }, '$weapons.quantity', 0]
              }
            },
            missingQuantity: {
              $sum: {
                $cond: [{ $eq: ['$weapons.condition', 'missing'] }, '$weapons.quantity', 0]
              }
            },
            // Get most common manufacturer
            manufacturers: { $addToSet: '$weapons.manufacturer' },
            // Count distinct armories containing this weapon type
            armoryCount: { $addToSet: '$_id' }
          }
        },
        {
          $project: {
            weaponType: '$_id',
            totalQuantity: 1,
            serviceableQuantity: 1,
            unserviceableQuantity: 1,
            underMaintenanceQuantity: 1,
            missingQuantity: 1,
            manufacturers: 1,
            armoryCount: { $size: '$armoryCount' },
            _id: 0
          }
        },
        { $sort: { weaponType: 1 } }
      ]);

      // Create a map for quick lookup
      const statsMap = weaponStats.reduce((acc, stat) => {
        acc[stat.weaponType] = stat;
        return acc;
      }, {});

      // Combine weapon types with their statistics
      weaponTypesWithStats = weaponTypes.map(weapon => {
        const stats = statsMap[weapon.weaponType] || {
          totalQuantity: 0,
          serviceableQuantity: 0,
          unserviceableQuantity: 0,
          underMaintenanceQuantity: 0,
          missingQuantity: 0,
          manufacturers: [],
          armoryCount: 0
        };

        const masterData = weaponMasterData[weapon.weaponType] || {};
        
        return {
          weaponType: weapon.weaponType,
          manufacturer: weapon.manufacturer || stats.manufacturers[0] || '',
          category: weapon.category || masterData.category || '',
          caliber: weapon.caliber || masterData.caliber || '',
          description: weapon.description || masterData.description || '',
          specifications: masterData.specifications || {},
          ...stats,
          availableQuantity: stats.serviceableQuantity, // Available = serviceable
          _id: weapon._id ? weapon._id.toString() : undefined
        };
      });
    } else {
      // Just add master data to weapon types
      weaponTypesWithStats = weaponTypes.map(weapon => {
        const masterData = weaponMasterData[weapon.weaponType] || {};
        
        return {
          weaponType: weapon.weaponType,
          manufacturer: weapon.manufacturer || masterData.manufacturer || '',
          category: weapon.category || masterData.category || '',
          caliber: weapon.caliber || masterData.caliber || '',
          description: weapon.description || masterData.description || '',
          specifications: masterData.specifications || {},
          _id: weapon._id ? weapon._id.toString() : undefined
        };
      });
    }

    // Get distinct categories from combined data
    const categories = [...new Set(weaponTypesWithStats
      .map(w => w.category)
      .filter(c => c))];

    return NextResponse.json({
      success: true,
      weaponTypes: weaponTypesWithStats,
      categories: categories,
      count: weaponTypesWithStats.length,
      includesStats: includeStats
    });
    
  } catch (error) {
    console.error('GET /api/armory/weapon-types error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch weapon types',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Optional: POST method to create weapon type in master collection
export async function POST(request) {
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

    const body = await request.json();
    
    // Validate required fields
    if (!body.weaponType) {
      return NextResponse.json(
        { error: 'Weapon type is required' },
        { status: 400 }
      );
    }

    // Check if Weapon model exists, otherwise use a different approach
    let weaponResponse;
    
    if (Weapon) {
      // Check if weapon type already exists in master collection
      const existingWeapon = await Weapon.findOne({ 
        weaponType: body.weaponType 
      });
      
      if (existingWeapon) {
        return NextResponse.json(
          { error: 'Weapon type already exists' },
          { status: 409 }
        );
      }

      // Create new weapon type in master collection
      const weapon = new Weapon({
        weaponType: body.weaponType.toUpperCase(),
        manufacturer: body.manufacturer || '',
        category: body.category || 'Rifle',
        caliber: body.caliber || '',
        description: body.description || '',
        specifications: body.specifications || {},
        createdBy: user.id
      });

      await weapon.save();

      weaponResponse = {
        ...weapon.toObject(),
        _id: weapon._id.toString(),
        createdBy: {
          _id: user.id,
          name: user.name,
          email: user.email
        },
        createdAt: weapon.createdAt.toISOString(),
        updatedAt: weapon.updatedAt.toISOString()
      };
    } else {
      // If no Weapon model, just return the submitted data
      weaponResponse = {
        weaponType: body.weaponType.toUpperCase(),
        manufacturer: body.manufacturer || '',
        category: body.category || 'Rifle',
        caliber: body.caliber || '',
        description: body.description || '',
        specifications: body.specifications || {},
        createdBy: {
          _id: user.id,
          name: user.name,
          email: user.email
        },
        createdAt: new Date().toISOString()
      };
    }

    return NextResponse.json(
      { 
        success: true,
        weapon: weaponResponse,
        message: 'Weapon type created successfully'
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('POST /api/armory/weapon-types error:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}