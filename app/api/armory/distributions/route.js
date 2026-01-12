import { NextResponse } from 'next/server';
import connectDB  from '@/lib/db';
import { authenticate, hasPermission } from '@/lib/auth';
import { distributionSchema } from '@/lib/validation';
import Distribution from '@/models/Distribution';
import Armory from '@/models/Armory';
import Officer from '@/models/Officer';
import mongoose from 'mongoose';

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
    const squadName = searchParams.get('squadName') || '';
    const armoryId = searchParams.get('armoryId') || '';
    const officerId = searchParams.get('officerId') || '';
    const status = searchParams.get('status') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const skip = (page - 1) * limit;
    
    let query = {};

    if (squadName) {
      query.squadName = { $regex: squadName, $options: 'i' };
    }

    if (armoryId) {
      query.armory = armoryId;
    }

    if (officerId) {
      query.officer = officerId;
    }

    if (status) {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.dateIssued = {};
      if (dateFrom) query.dateIssued.$gte = new Date(dateFrom);
      if (dateTo) query.dateIssued.$lte = new Date(dateTo);
    }

    const [distributions, total] = await Promise.all([
      Distribution.find(query)
        .populate('armory', 'armoryName armoryCode')
        .populate('officer', 'serviceNo name rank')
        .populate('issuedBy', 'name email')
        .sort({ dateIssued: -1 })
        .skip(skip)
        .limit(limit),
      Distribution.countDocuments(query)
    ]);

    return NextResponse.json({
      distributions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GET /api/distributions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Connect to database
    await connectDB();
    
    // Authenticate user
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "armourer") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate request body
    const validationResult = distributionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { armoryId, officerId, weapons = [], ammunition = [], equipment = [], ...data } = validationResult.data;

    // Fetch armory with proper projection to avoid virtuals issue
    const armory = await Armory.findById(armoryId).select('weapons ammunition equipment armoryName armoryCode');
    const officer = await Officer.findById(officerId);

    if (!armory) {
      return NextResponse.json({ error: 'Armory not found' }, { status: 404 });
    }
    
    if (!officer) {
      return NextResponse.json({ error: 'Officer not found' }, { status: 404 });
    }

    // Ensure arrays exist
    if (!armory.weapons) armory.weapons = [];
    if (!armory.ammunition) armory.ammunition = [];
    if (!armory.equipment) armory.equipment = [];

    // Prepare arrays for issued items
    const weaponsIssued = [];
    const ammunitionIssued = [];
    const equipmentIssued = [];

    // Validate and prepare weapons
    for (const item of weapons) {
      const weaponId = mongoose.Types.ObjectId.isValid(item.weaponId) 
        ? new mongoose.Types.ObjectId(item.weaponId)
        : item.weaponId;
      
      const weaponIndex = armory.weapons.findIndex(w => 
        w._id && w._id.toString() === weaponId.toString()
      );
      
      if (weaponIndex === -1) {
        return NextResponse.json(
          { error: `Weapon not found: ${item.weaponId}` },
          { status: 400 }
        );
      }

      const weapon = armory.weapons[weaponIndex];
      const availableQuantity = weapon.availableQuantity !== undefined 
        ? weapon.availableQuantity 
        : weapon.quantity;
      
      if (availableQuantity < item.quantity) {
        return NextResponse.json({
          error: `Insufficient stock for weapon: ${weapon.serialNumber || weapon.weaponType}`,
          available: availableQuantity,
          requested: item.quantity
        }, { status: 400 });
      }

      // Add to issued items
      weaponsIssued.push({
        itemRef: weapon._id,
        itemType: 'weapon',
        itemSnapshot: {
          weaponType: weapon.weaponType,
          serialNumber: weapon.serialNumber,
          model: weapon.model || '',
          caliber: weapon.caliber || '',
          manufacturer: weapon.manufacturer || '',
          condition: weapon.condition,
          quantity: weapon.quantity
        },
        quantity: item.quantity,
        conditionAtIssue: weapon.condition || 'serviceable'
      });

      // Update quantity in memory
      if (weapon.availableQuantity !== undefined) {
        armory.weapons[weaponIndex].availableQuantity -= item.quantity;
      } else {
        armory.weapons[weaponIndex].quantity -= item.quantity;
      }
    }

    // Validate and prepare ammunition
    for (const item of ammunition) {
      const ammoId = mongoose.Types.ObjectId.isValid(item.ammunitionId)
        ? new mongoose.Types.ObjectId(item.ammunitionId)
        : item.ammunitionId;
      
      const ammoIndex = armory.ammunition.findIndex(a => 
        a._id && a._id.toString() === ammoId.toString()
      );
      
      if (ammoIndex === -1) {
        return NextResponse.json(
          { error: `Ammunition not found: ${item.ammunitionId}` },
          { status: 400 }
        );
      }

      const ammo = armory.ammunition[ammoIndex];
      const availableQuantity = ammo.availableQuantity !== undefined 
        ? ammo.availableQuantity 
        : ammo.quantity;
      
      if (availableQuantity < item.quantity) {
        return NextResponse.json({
          error: `Insufficient stock for ammunition: ${ammo.caliber || 'Unknown'}`,
          available: availableQuantity,
          requested: item.quantity
        }, { status: 400 });
      }

      ammunitionIssued.push({
        itemRef: ammo._id,
        itemType: 'ammunition',
        itemSnapshot: {
          caliber: ammo.caliber,
          type: ammo.type,
          lotNumber: ammo.lotNumber || '',
          manufacturer: ammo.manufacturer || '',
          expiryDate: ammo.expiryDate,
          quantity: ammo.quantity
        },
        quantity: item.quantity,
        conditionAtIssue: ammo.condition || 'good'
      });

      // Update quantity in memory
      if (ammo.availableQuantity !== undefined) {
        armory.ammunition[ammoIndex].availableQuantity -= item.quantity;
      } else {
        armory.ammunition[ammoIndex].quantity -= item.quantity;
      }
    }

    // Validate and prepare equipment
    for (const item of equipment) {
      const equipId = mongoose.Types.ObjectId.isValid(item.equipmentId)
        ? new mongoose.Types.ObjectId(item.equipmentId)
        : item.equipmentId;
      
      const equipIndex = armory.equipment.findIndex(e => 
        e._id && e._id.toString() === equipId.toString()
      );
      
      if (equipIndex === -1) {
        return NextResponse.json(
          { error: `Equipment not found: ${item.equipmentId}` },
          { status: 400 }
        );
      }

      const equip = armory.equipment[equipIndex];
      const availableQuantity = equip.availableQuantity !== undefined 
        ? equip.availableQuantity 
        : equip.quantity;
      
      if (availableQuantity < item.quantity) {
        return NextResponse.json({
          error: `Insufficient stock for equipment: ${equip.itemType || 'Unknown'}`,
          available: availableQuantity,
          requested: item.quantity
        }, { status: 400 });
      }

      equipmentIssued.push({
        itemRef: equip._id,
        itemType: 'equipment',
        itemSnapshot: {
          itemType: equip.itemType,
          size: equip.size || '',
          serialNumber: equip.serialNumber || '',
          manufacturer: equip.manufacturer || '',
          condition: equip.condition,
          quantity: equip.quantity
        },
        quantity: item.quantity,
        conditionAtIssue: equip.condition || 'serviceable'
      });

      // Update quantity in memory
      if (equip.availableQuantity !== undefined) {
        armory.equipment[equipIndex].availableQuantity -= item.quantity;
      } else {
        armory.equipment[equipIndex].quantity -= item.quantity;
      }
    }

    // Generate distribution number
    const distributionNo = `DIS-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Calculate renewal due date (30 days from now)
    const renewalDue = new Date();
    renewalDue.setDate(renewalDue.getDate() + 30);

    // Create distribution record
    const distribution = new Distribution({
      distributionNo,
      armory: armoryId,
      officer: officerId,
      issuedBy: user.id,
      squadName: data.squadName,
      dateIssued: new Date(),
      renewalDue,
      weaponsIssued,
      ammunitionIssued,
      equipmentIssued,
      remarks: data.remarks,
      createdBy: user.id
    });

    // Save both documents - if one fails, the other won't be saved
    await distribution.save();
    await armory.save();
    return NextResponse.json(distribution, { status: 201 });

  } catch (error) {
    console.error('POST /api/distributions error:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) { // Duplicate key error
      return NextResponse.json(
        { error: 'Duplicate distribution number' },
        { status: 400 }
      );
    }

    if (error.message && error.message.includes('Insufficient stock')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


/* export async function POST(request) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await connectDB();
    const user = await authenticate(request);
    
    if (!user) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, 'create', 'distributions')) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    const validationResult = distributionSchema.safeParse(body);
    if (!validationResult.success) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { armoryId, officerId, weapons, ammunition, equipment, ...data } = validationResult.data;

    // Verify armory and officer exist
    const [armory, officer] = await Promise.all([
      Armory.findById(armoryId).session(session),
      Officer.findById(officerId).session(session)
    ]);

    if (!armory) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'Armory not found' }, { status: 404 });
    }

    if (!officer) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'Officer not found' }, { status: 404 });
    }

    // Validate stock availability and prepare issued items
    const weaponsIssued = [];
    const ammunitionIssued = [];
    const equipmentIssued = [];

    // Check weapons availability
    for (const item of weapons) {
      const weapon = armory.weapons.id(item.weaponId);
      if (!weapon) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: `Weapon not found: ${item.weaponId}` },
          { status: 400 }
        );
      }

      if (weapon.availableQuantity < item.quantity) {
        await session.abortTransaction();
        return NextResponse.json(
          { 
            error: `Insufficient stock for weapon: ${weapon.serialNumber}`,
            available: weapon.availableQuantity,
            requested: item.quantity
          },
          { status: 400 }
        );
      }

      weaponsIssued.push({
        itemRef: weapon._id,
        itemType: 'weapon',
        itemSnapshot: weapon.toObject(),
        quantity: item.quantity,
        conditionAtIssue: weapon.condition
      });

      // Decrement available quantity
      weapon.availableQuantity -= item.quantity;
    }

    // Check ammunition availability
    for (const item of ammunition) {
      const ammo = armory.ammunition.id(item.ammunitionId);
      if (!ammo) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: `Ammunition not found: ${item.ammunitionId}` },
          { status: 400 }
        );
      }

      if (ammo.availableQuantity < item.quantity) {
        await session.abortTransaction();
        return NextResponse.json(
          { 
            error: `Insufficient stock for ammunition: ${ammo.caliber} - ${ammo.lotNumber}`,
            available: ammo.availableQuantity,
            requested: item.quantity
          },
          { status: 400 }
        );
      }

      ammunitionIssued.push({
        itemRef: ammo._id,
        itemType: 'ammunition',
        itemSnapshot: ammo.toObject(),
        quantity: item.quantity,
        conditionAtIssue: ammo.condition
      });

      // Decrement available quantity
      ammo.availableQuantity -= item.quantity;
    }

    // Check equipment availability
    for (const item of equipment) {
      const equip = armory.equipment.id(item.equipmentId);
      if (!equip) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: `Equipment not found: ${item.equipmentId}` },
          { status: 400 }
        );
      }

      if (equip.availableQuantity < item.quantity) {
        await session.abortTransaction();
        return NextResponse.json(
          { 
            error: `Insufficient stock for equipment: ${equip.name}`,
            available: equip.availableQuantity,
            requested: item.quantity
          },
          { status: 400 }
        );
      }

      equipmentIssued.push({
        itemRef: equip._id,
        itemType: 'equipment',
        itemSnapshot: equip.toObject(),
        quantity: item.quantity,
        conditionAtIssue: equip.condition
      });

      // Decrement available quantity
      equip.availableQuantity -= item.quantity;
    }

    // Generate distribution number
    const distributionNo = `DIS-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Calculate renewal due date (30 days from now)
    const renewalDue = new Date();
    renewalDue.setDate(renewalDue.getDate() + 30);

    // Create distribution record
    const distribution = new Distribution({
      distributionNo,
      armory: armoryId,
      officer: officerId,
      issuedBy: user.id,
      squadName: data.squadName,
      dateIssued: new Date(),
      renewalDue,
      weaponsIssued,
      ammunitionIssued,
      equipmentIssued,
      remarks: data.remarks,
      createdBy: user.id
    });

    // Save distribution and update armory in transaction
    await distribution.save({ session });
    await armory.save({ session });

    await session.commitTransaction();

    // Populate references for response
    await distribution.populate('armory', 'armoryName armoryCode');
    await distribution.populate('officer', 'serviceNo name rank');
    await distribution.populate('issuedBy', 'name email');

    return NextResponse.json(distribution, { status: 201 });
  } catch (error) {
    await session.abortTransaction();
    console.error('POST /api/distributions error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
} */