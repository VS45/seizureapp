import { NextResponse } from 'next/server';
import Armory from '@/models/Armory';
import connectDB from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const armoryId = searchParams.get('armoryId');
    const itemType = searchParams.get('itemType'); // 'weapon', 'ammunition', 'equipment'
    const weaponType = searchParams.get('weaponType');
    const weaponModel = searchParams.get('weaponModel');
    const caliber = searchParams.get('caliber');
    const ammoType = searchParams.get('ammoType');
    const equipmentType = searchParams.get('equipmentType');

    if (!armoryId || !itemType) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    await connectDB();
    const armory = await Armory.findById(armoryId);
    
    if (!armory) {
      return NextResponse.json({ 
        error: 'Armory not found' 
      }, { status: 404 });
    }

    let availableQuantity = 0;
    let existingItem = null;

    switch(itemType) {
      case 'weapon':
        if (!weaponType || !weaponModel) {
          return NextResponse.json({ 
            error: 'Weapon type and model are required' 
          }, { status: 400 });
        }
        
        // Find existing weapon with matching type and manufacturer
        existingItem = armory.weapons.find(w => 
          w.weaponType === weaponType && w.manufacturer === weaponModel
        );
        availableQuantity = existingItem ? existingItem.quantity : 0;
        break;
        
      case 'ammunition':
        if (!caliber || !ammoType) {
          return NextResponse.json({ 
            error: 'Caliber and type are required' 
          }, { status: 400 });
        }
        
        existingItem = armory.ammunition.find(a => 
          a.caliber === caliber && a.type === ammoType
        );
        availableQuantity = existingItem ? existingItem.quantity : 0;
        break;
        
      case 'equipment':
        if (!equipmentType) {
          return NextResponse.json({ 
            error: 'Equipment type is required' 
          }, { status: 400 });
        }
        
        existingItem = armory.equipment.find(e => 
          e.itemType === equipmentType
        );
        availableQuantity = existingItem ? existingItem.quantity : 0;
        break;
        
      default:
        return NextResponse.json({ 
          error: 'Invalid item type' 
        }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      availableQuantity,
      existingItem: existingItem ? {
        ...existingItem.toObject(),
        _id: existingItem._id.toString()
      } : null
    });
    
  } catch (error) {
    console.error("Error fetching available quantity:", error);
    return NextResponse.json({ 
      error: "Failed to fetch available quantity", 
      details: error.message 
    }, { status: 500 });
  }
}