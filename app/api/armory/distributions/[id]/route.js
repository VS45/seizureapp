import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';
import Distribution from '@/models/Distribution';
import Armory from '@/models/Armory';

// GET /api/distributions/[id] - Get single distribution
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { user } = await authenticate(request);
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
    
    const distribution = await Distribution.findById(id);
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
  try {
    await connectDB();

    const { user } = await authenticate(request);
    
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
    const body = await request.json();

    // Fetch distribution
    const distribution = await Distribution.findById(id);
    if (!distribution) {
      return NextResponse.json({ error: 'Distribution not found' }, { status: 404 });
    }

    // Handle item returns
    if (body.returnItems && Array.isArray(body.returnItems)) {
      // Fetch the armory
      const armory = await Armory.findById(distribution.armory);
      if (!armory) {
        return NextResponse.json({ error: 'Armory not found' }, { status: 404 });
      }

      // Ensure arrays exist
      if (!armory.weapons) armory.weapons = [];
      if (!armory.ammunition) armory.ammunition = [];
      if (!armory.equipment) armory.equipment = [];

      // Process each return item
      for (const returnItem of body.returnItems) {
        // Find the issued item in the appropriate array
        let issuedItem = null;
        let itemArray = null;

        switch (returnItem.itemType) {
          case 'weapon':
            itemArray = distribution.weaponsIssued;
            break;
          case 'ammunition':
            itemArray = distribution.ammunitionIssued;
            break;
          case 'equipment':
            itemArray = distribution.equipmentIssued;
            break;
          default:
            continue;
        }

        // Find the issued item by itemRef
        if (itemArray && itemArray.length > 0) {
          issuedItem = itemArray.find(item => 
            item.itemRef && item.itemRef.toString() === returnItem.itemRef
          );
        }

        if (issuedItem) {
          // Calculate return quantity (cannot exceed issued quantity minus already returned)
          const maxReturnable = issuedItem.quantity - (issuedItem.returnedQuantity || 0);
          const returnQuantity = Math.min(returnItem.quantity || 0, maxReturnable);
          
          if (returnQuantity > 0) {
            // Update returned quantity
            issuedItem.returnedQuantity = (issuedItem.returnedQuantity || 0) + returnQuantity;
            issuedItem.conditionAtReturn = returnItem.condition;

            // Update armory inventory based on item type
            switch (returnItem.itemType) {
              case 'weapon':
                const weaponIndex = armory.weapons.findIndex(w => 
                  w._id && w._id.toString() === returnItem.itemRef
                );
                if (weaponIndex !== -1) {
                  const weapon = armory.weapons[weaponIndex];
                  // Use availableQuantity if exists, otherwise use quantity
                  if (weapon.availableQuantity !== undefined) {
                    weapon.availableQuantity += returnQuantity;
                  } else {
                    weapon.quantity += returnQuantity;
                  }
                  // Update condition if provided
                  if (returnItem.condition) {
                    weapon.condition = returnItem.condition;
                  }
                }
                break;
                
              case 'ammunition':
                const ammoIndex = armory.ammunition.findIndex(a => 
                  a._id && a._id.toString() === returnItem.itemRef
                );
                if (ammoIndex !== -1) {
                  const ammunition = armory.ammunition[ammoIndex];
                  if (ammunition.availableQuantity !== undefined) {
                    ammunition.availableQuantity += returnQuantity;
                  } else {
                    ammunition.quantity += returnQuantity;
                  }
                }
                break;
                
              case 'equipment':
                const equipIndex = armory.equipment.findIndex(e => 
                  e._id && e._id.toString() === returnItem.itemRef
                );
                if (equipIndex !== -1) {
                  const equipment = armory.equipment[equipIndex];
                  if (equipment.availableQuantity !== undefined) {
                    equipment.availableQuantity += returnQuantity;
                  } else {
                    equipment.quantity += returnQuantity;
                  }
                  // Update condition if provided
                  if (returnItem.condition) {
                    equipment.condition = returnItem.condition;
                  }
                }
                break;
            }
          }
        }
      }

      // Calculate total issued and returned quantities
      const allIssuedItems = [
        ...(distribution.weaponsIssued || []),
        ...(distribution.ammunitionIssued || []),
        ...(distribution.equipmentIssued || [])
      ];
      
      const totalIssued = allIssuedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalReturned = allIssuedItems.reduce((sum, item) => sum + (item.returnedQuantity || 0), 0);
      
      // Update distribution status based on return completion
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

      // Save updated armory
      await armory.save();
    }

    // Handle renewal
    if (body.renewal) {
      distribution.renewalHistory = distribution.renewalHistory || [];
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

    // Save distribution
    await distribution.save();

    return NextResponse.json({
      success: true,
      distribution,
      message: 'Distribution updated successfully'
    });
  } catch (error) {
    console.error('PUT /api/distributions/[id] error:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error.name === 'CastError') {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/distributions/[id] - Delete distribution
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { user } = await authenticate(request);
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