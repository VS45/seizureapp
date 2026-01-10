import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { authenticate, hasPermission } from '@/lib/auth';
import Distribution from '@/models/Distribution';
import Armory from '@/models/Armory';
import mongoose from 'mongoose';

// GET /api/distributions/[id] - Get single distribution
export async function GET(request, { params }) {
  try {
    await connectDB();

    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, 'read', 'distributions')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } =await params;
    
    const distribution = await Distribution.findById(id)
      .populate('armory', 'armoryName armoryCode location unit')
      .populate('officer', 'serviceNo name rank unit')
      .populate('issuedBy', 'name email')
      .populate('returnedBy', 'name email')
      .populate('createdBy', 'name email')
      .populate('renewalHistory.renewedBy', 'name email');

    if (!distribution) {
      return NextResponse.json({ error: 'Distribution not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      distribution 
    });
  } catch (error) {
    console.error('GET /api/distributions/[id] error:', error);
    
    if (error.name === 'CastError') {
      return NextResponse.json({ error: 'Invalid distribution ID' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/distributions/[id] - Update distribution (return items, renew, etc.)
export async function PUT(request, { params }) {
  const session = await mongoose.startSession();
  
  try {
    await session.startTransaction();
    await connectDB();

    const user = await authenticate(request);
    
    if (!user) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, 'update', 'distributions')) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } =await params;
    const body = await request.json();

    const distribution = await Distribution.findById(id).session(session);
    if (!distribution) {
      await session.abortTransaction();
      return NextResponse.json({ error: 'Distribution not found' }, { status: 404 });
    }

    // Handle item returns
    if (body.returnItems && Array.isArray(body.returnItems)) {
      const armory = await Armory.findById(distribution.armory).session(session);
      if (!armory) {
        await session.abortTransaction();
        return NextResponse.json({ error: 'Armory not found' }, { status: 404 });
      }
      
      for (const returnItem of body.returnItems) {
        // Find the issued item in the appropriate array
        let issuedItems;
        switch (returnItem.itemType) {
          case 'weapon':
            issuedItems = distribution.weaponsIssued;
            break;
          case 'ammunition':
            issuedItems = distribution.ammunitionIssued;
            break;
          case 'equipment':
            issuedItems = distribution.equipmentIssued;
            break;
          default:
            continue;
        }

        const issuedItem = issuedItems.id(returnItem.itemRef);
        if (issuedItem) {
          const returnQuantity = Math.min(
            returnItem.quantity,
            issuedItem.quantity - issuedItem.returnedQuantity
          );
          
          issuedItem.returnedQuantity += returnQuantity;
          issuedItem.conditionAtReturn = returnItem.condition;

          // Update armory inventory based on item type
          switch (returnItem.itemType) {
            case 'weapon':
              const weapon = armory.weapons.id(returnItem.itemRef);
              if (weapon) {
                weapon.availableQuantity += returnQuantity;
                if (returnItem.condition) {
                  weapon.condition = returnItem.condition;
                }
              }
              break;
              
            case 'ammunition':
              const ammunition = armory.ammunition.id(returnItem.itemRef);
              if (ammunition) {
                ammunition.availableQuantity += returnQuantity;
              }
              break;
              
            case 'equipment':
              const equipment = armory.equipment.id(returnItem.itemRef);
              if (equipment) {
                equipment.availableQuantity += returnQuantity;
                if (returnItem.condition) {
                  equipment.condition = returnItem.condition;
                }
              }
              break;
          }
        }
      }

      // Update distribution status based on return completion
      const allIssuedItems = [
        ...distribution.weaponsIssued,
        ...distribution.ammunitionIssued,
        ...distribution.equipmentIssued
      ];
      
      const totalIssued = allIssuedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalReturned = allIssuedItems.reduce((sum, item) => sum + item.returnedQuantity, 0);
      
      if (totalReturned === 0) {
        distribution.status = 'issued';
      } else if (totalReturned === totalIssued) {
        distribution.status = 'returned';
        distribution.returnDate = new Date();
        distribution.returnedBy = user.id;
      } else {
        distribution.status = 'partial_return';
        distribution.returnDate = new Date();
        distribution.returnedBy = user.id;
      }

      await armory.save({ session });
    }

    // Handle renewal
    if (body.renewal) {
      distribution.renewalHistory.push({
        renewedAt: new Date(),
        renewedBy: user.id,
        nextRenewalDate: body.renewal.nextRenewalDate,
        condition: body.renewal.condition,
        remarks: body.renewal.remarks
      });
      
      distribution.renewalDue = body.renewal.nextRenewalDate;
      distribution.renewalStatus = 'renewed';
    }

    // Update other fields
    if (body.remarks !== undefined) distribution.remarks = body.remarks;
    if (body.status) distribution.status = body.status;
    if (body.squadName) distribution.squadName = body.squadName;
    if (body.renewalStatus) distribution.renewalStatus = body.renewalStatus;

    await distribution.save({ session });
    await session.commitTransaction();

    // Repopulate the updated distribution
    await distribution.populate('armory', 'armoryName armoryCode location unit');
    await distribution.populate('officer', 'serviceNo name rank unit');
    await distribution.populate('issuedBy', 'name email');
    await distribution.populate('returnedBy', 'name email');
    await distribution.populate('createdBy', 'name email');
    await distribution.populate('renewalHistory.renewedBy', 'name email');

    return NextResponse.json({
      success: true,
      distribution,
      message: 'Distribution updated successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('PUT /api/distributions/[id] error:', error);
    
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
  } finally {
    await session.endSession();
  }
}

// DELETE /api/distributions/[id] - Delete distribution
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, 'delete', 'distributions')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } =await params;
    const distribution = await Distribution.findByIdAndDelete(id);

    if (!distribution) {
      return NextResponse.json({ error: 'Distribution not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Distribution deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /api/distributions/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}