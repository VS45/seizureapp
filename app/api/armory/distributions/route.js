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
  // Ensure DB connection first
  try {
    await connectDB();
  } catch (err) {
    console.error('POST /api/distributions connectDB error:', err);
    return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
  }

  // Authenticate user (after DB connection)
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

  // Parse + validate request body
  let body;
  try {
    body = await request.json();
  } catch (err) {
    console.error('POST /api/distributions parse body error:', err);
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validationResult = distributionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.issues },
      { status: 400 }
    );
  }

  const { armoryId, officerId, weapons = [], ammunition = [], equipment = [], ...data } = validationResult.data;

  // Start a session per-request (after DB connection and auth)
  const session = await mongoose.startSession();

  // retry loop for transient transaction errors
  const MAX_RETRIES = 3;
  let attempt = 0;

  try {
    while (attempt < MAX_RETRIES) {
      attempt += 1;
      try {
        const transactionOptions = {
          readConcern: { level: 'local' },
          writeConcern: { w: 'majority' }
        };

        let distributionDoc = null;

        await session.withTransaction(async () => {
          // Fetch armory and officer within the transaction (pass session)
          // Note: Could use Promise.all but ensure each call uses the session
          const [armory, officer] = await Promise.all([
            Armory.findById(armoryId).session(session),
            Officer.findById(officerId).session(session)
          ]);

          if (!armory) {
            throw { status: 404, message: 'Armory not found' };
          }
          if (!officer) {
            throw { status: 404, message: 'Officer not found' };
          }

          // Validate stock and prepare issued item snapshots
          const weaponsIssued = [];
          const ammunitionIssued = [];
          const equipmentIssued = [];

          // Weapons
          for (const item of weapons) {
            const weapon = armory.weapons.id(item.weaponId);
            if (!weapon) {
              throw { status: 400, message: `Weapon not found: ${item.weaponId}` };
            }
            if (weapon.quantity < item.quantity) {
              throw {
                status: 400,
                message: `Insufficient stock for weapon: ${weapon.serialNumber}`,
                available: weapon.quantity,
                requested: item.quantity
              };
            }

            weaponsIssued.push({
              itemRef: weapon._id,
              itemType: 'weapon',
              itemSnapshot: weapon.toObject(),
              quantity: item.quantity,
              conditionAtIssue: weapon.condition
            });

            weapon.quantity -= item.quantity;
          }

          // Ammunition
          for (const item of ammunition) {
            const ammo = armory.ammunition.id(item.ammunitionId);
            if (!ammo) {
              throw { status: 400, message: `Ammunition not found: ${item.ammunitionId}` };
            }
            if (ammo.availableQuantity < item.quantity) {
              throw {
                status: 400,
                message: `Insufficient stock for ammunition: ${ammo.caliber} - ${ammo.lotNumber}`,
                available: ammo.availableQuantity,
                requested: item.quantity
              };
            }

            ammunitionIssued.push({
              itemRef: ammo._id,
              itemType: 'ammunition',
              itemSnapshot: ammo.toObject(),
              quantity: item.quantity,
              conditionAtIssue: ammo.condition
            });

            ammo.availableQuantity -= item.quantity;
          }

          // Equipment
          for (const item of equipment) {
            const equip = armory.equipment.id(item.equipmentId);
            if (!equip) {
              throw { status: 400, message: `Equipment not found: ${item.equipmentId}` };
            }
            if (equip.availableQuantity < item.quantity) {
              throw {
                status: 400,
                message: `Insufficient stock for equipment: ${equip.name}`,
                available: equip.availableQuantity,
                requested: item.quantity
              };
            }

            equipmentIssued.push({
              itemRef: equip._id,
              itemType: 'equipment',
              itemSnapshot: equip.toObject(),
              quantity: item.quantity,
              conditionAtIssue: equip.condition
            });

            equip.availableQuantity -= item.quantity;
          }

          // Build distribution record
          const distributionNo = `DIS-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
          const renewalDue = new Date();
          renewalDue.setDate(renewalDue.getDate() + 30);

          const dist = new Distribution({
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

          // Save distribution within session and update armory (also within session)
          await dist.save({ session });
          await armory.save({ session });

          distributionDoc = dist; // keep reference for after transaction
        }, transactionOptions);

        // If we reach here, transaction committed successfully
        // populate references for the response (outside transaction)
        if (distributionDoc) {
          await distributionDoc.populate('armory', 'armoryName armoryCode');
          await distributionDoc.populate('officer', 'serviceNo name rank');
          await distributionDoc.populate('issuedBy', 'name email');

          return NextResponse.json(distributionDoc, { status: 201 });
        }

        // If transaction completed but no distribution (unexpected)
        return NextResponse.json({ error: 'Transaction did not produce distribution' }, { status: 500 });

      } catch (txnError) {
        // Transaction-level errors: if it's a retryable/transient transaction error, retry
        const isTransient = txnError && txnError.errorLabels && (
          txnError.errorLabels.includes('TransientTransactionError') ||
          txnError.errorLabels.includes('UnknownTransactionCommitResult')
        );

        // If thrown by our code as {status, message}
        if (txnError && txnError.status && txnError.message) {
          // Non-transient application error: return immediately
          console.error('POST /api/distributions application error inside transaction:', txnError);
          return NextResponse.json({ error: txnError.message }, { status: txnError.status });
        }

        console.warn(`POST /api/distributions transaction attempt ${attempt} failed:`, txnError);

        if (isTransient && attempt < MAX_RETRIES) {
          // short backoff then retry
          await new Promise((res) => setTimeout(res, 100 * attempt));
          continue;
        }

        // Non-retryable or ran out of retries
        throw txnError;
      }
    } // end retry loop
  } catch (error) {
    // Ensure session is aborted (withTransaction already aborts on exceptions, but double-check)
    try {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
    } catch (abortErr) {
      console.error('Error aborting transaction after failure:', abortErr);
    }

    console.error('POST /api/distributions error:', error);

    // If our app threw a structured error object, return its status/message
    if (error && error.status && error.message) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    // Always end the session
    try {
      session.endSession();
    } catch (endErr) {
      console.error('Error ending session:', endErr);
    }
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