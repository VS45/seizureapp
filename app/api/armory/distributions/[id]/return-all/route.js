// app/api/armory/distributions/[id]/return-all/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';
import Distribution from '@/models/Distribution';
import Armory from '@/models/Armory';

export async function POST(request, { params }) {
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
    
    // Fetch distribution
    const distribution = await Distribution.findById(id);
    if (!distribution) {
      return NextResponse.json({ error: 'Distribution not found' }, { status: 404 });
    }

    // Fetch the armory
    const armory = await Armory.findById(distribution.armory);
    if (!armory) {
      return NextResponse.json({ error: 'Armory not found' }, { status: 404 });
    }

    // Process all items for return
    const processReturn = (items, itemType) => {
      if (!items || !Array.isArray(items)) return;
      
      items.forEach(item => {
        if (!item.itemRef) return;
        
        const returnQuantity = item.quantity - (item.returnedQuantity || 0);
        if (returnQuantity <= 0) return;
        
        // Update distribution item
        item.returnedQuantity = (item.returnedQuantity || 0) + returnQuantity;
        item.conditionAtReturn = item.conditionAtIssue || 'serviceable';
        
        // Update armory inventory
        switch (itemType) {
          case 'weapon':
            const weaponIndex = armory.weapons.findIndex(w => 
              w._id && w._id.toString() === item.itemRef.toString()
            );
            if (weaponIndex !== -1) {
              armory.weapons[weaponIndex].quantity += returnQuantity;
              armory.weapons[weaponIndex].condition = item.conditionAtIssue || 'serviceable';
            }
            break;
            
          case 'ammunition':
            const ammoIndex = armory.ammunition.findIndex(a => 
              a._id && a._id.toString() === item.itemRef.toString()
            );
            if (ammoIndex !== -1) {
              armory.ammunition[ammoIndex].quantity += returnQuantity;
            }
            break;
            
          case 'equipment':
            const equipIndex = armory.equipment.findIndex(e => 
              e._id && e._id.toString() === item.itemRef.toString()
            );
            if (equipIndex !== -1) {
              armory.equipment[equipIndex].quantity += returnQuantity;
              armory.equipment[equipIndex].condition = item.conditionAtIssue || 'serviceable';
            }
            break;
        }
      });
    };

    // Process all item types
    processReturn(distribution.weaponsIssued, 'weapon');
    processReturn(distribution.ammunitionIssued, 'ammunition');
    processReturn(distribution.equipmentIssued, 'equipment');

    // Update distribution status
    distribution.status = 'returned';
    distribution.returnDate = new Date();
    distribution.returnedBy = user.id;

    // Save both documents
    await Promise.all([
      distribution.save(),
      armory.save()
    ]);

    return NextResponse.json({
      success: true,
      distribution,
      message: 'All items returned successfully'
    });
  } catch (error) {
    console.error('Return all items error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}