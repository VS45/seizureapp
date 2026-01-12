
//api/armories/[id]/route.js
import { NextResponse } from 'next/server';
import Armory from '@/models/Armory';
import connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';

// GET - Get single armory by ID
export async function GET(request, { params }) {
  try {
    // Authenticate user
    const { user } = await authenticate(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check permissions
    if (user.role !== "admin" && user.role !== "armourer") {
      return NextResponse.json(
        { error: "Insufficient permissions to access armory data" },
        { status: 403 }
      );
    }

    await connectDB();
    
    const { id } = await params;
    const armory = await Armory.findById(id)
      .populate('createdBy', 'name email');

    if (!armory) {
      return NextResponse.json(
        { error: "Armory not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this specific armory
    if (user.role !== "admin" && user.unit !== armory.unit) {
      return NextResponse.json(
        { error: "Access denied to this armory" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      armory
    });
  } catch (error) {
    console.error("Failed to fetch armory:", error);
    return NextResponse.json(
      { error: "Failed to fetch armory", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update armory
export async function PUT(request, { params }) {
  try {
    // Authenticate user
    const { user } = await authenticate(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check permissions
    if (user.role !== "admin" && user.role !== "armory") {
      return NextResponse.json(
        { error: "Insufficient permissions to update armories" },
        { status: 403 }
      );
    }

    await connectDB();
    
    const { id } = await params;
    const body = await request.json();

    const armory = await Armory.findById(id);
    if (!armory) {
      return NextResponse.json(
        { error: "Armory not found" },
        { status: 404 }
      );
    }

    // Check if user has access to update this specific armory
    if (user.role !== "admin" && user.unit !== armory.unit) {
      return NextResponse.json(
        { error: "Access denied to update this armory" },
        { status: 403 }
      );
    }

    // Update armory
    const updatedArmory = await Armory.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    return NextResponse.json({
      success: true,
      armory: updatedArmory,
      message: "Armory updated successfully"
    });
  } catch (error) {
    console.error("Failed to update armory:", error);
    return NextResponse.json(
      { error: "Failed to update armory", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete armory
export async function DELETE(request, { params }) {
  try {
    // Authenticate user
    const { user } = await authenticate(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Only admin can delete armories
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions to delete armories" },
        { status: 403 }
      );
    }

    await connectDB();
    
    const { id } =await params;
    const armory = await Armory.findById(id);

    if (!armory) {
      return NextResponse.json(
        { error: "Armory not found" },
        { status: 404 }
      );
    }

    await Armory.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Armory deleted successfully"
    });
  } catch (error) {
    console.error("Failed to delete armory:", error);
    return NextResponse.json(
      { error: "Failed to delete armory", details: error.message },
      { status: 500 }
    );
  }
  
}
// PATCH - Update armory inventory (add new items)
export async function PATCH(request, { params }) {
  try {
    // Authenticate user
    const { user } = await authenticate(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check permissions
    if (user.role !== "admin" && user.role !== "armourer") {
      return NextResponse.json(
        { error: "Insufficient permissions to update armory inventory" },
        { status: 403 }
      );
    }

    await connectDB();
    
    const { id } = await params;
    const body = await request.json();

    const armory = await Armory.findById(id);
    if (!armory) {
      return NextResponse.json(
        { error: "Armory not found" },
        { status: 404 }
      );
    }

    // Check if user has access to update this specific armory
    if (user.role !== "admin" && user.unit !== armory.unit) {
      return NextResponse.json(
        { error: "Access denied to update this armory's inventory" },
        { status: 403 }
      );
    }

    // Handle new weapons
    if (body.weapons && Array.isArray(body.weapons)) {
      for (const newWeapon of body.weapons) {
        // Check if weapon with same serial number already exists
        const existingWeapon = armory.weapons.find(w => 
          w.serialNumber === newWeapon.serialNumber
        );

        if (existingWeapon) {
          // Update existing weapon quantity
          existingWeapon.quantity += newWeapon.quantity;
        } else {
          // Add new weapon
          armory.weapons.push({
            ...newWeapon,
            acquisitionDate: new Date()
          });
        }
      }
    }

    // Handle new ammunition
    if (body.ammunition && Array.isArray(body.ammunition)) {
      for (const newAmmo of body.ammunition) {
        const existingAmmo = armory.ammunition.find(a => 
          a.caliber === newAmmo.caliber && 
          a.type === newAmmo.type &&
          a.lotNumber === newAmmo.lotNumber
        );

        if (existingAmmo) {
          // Update existing ammunition quantity
          existingAmmo.quantity += newAmmo.quantity;
          existingAmmo.manufactureDate = newAmmo.manufactureDate || existingAmmo.manufactureDate;
          existingAmmo.expiryDate = newAmmo.expiryDate || existingAmmo.expiryDate;
        } else {
          // Add new ammunition
          armory.ammunition.push({
            ...newAmmo,
            unit: newAmmo.unit || 'rounds'
          });
        }
      }
    }

    // Handle new equipment
    if (body.equipment && Array.isArray(body.equipment)) {
      for (const newEquip of body.equipment) {
        const existingEquip = armory.equipment.find(e => 
          e.itemType === newEquip.itemType &&
          e.serialNumber === newEquip.serialNumber
        );

        if (existingEquip) {
          // Update existing equipment quantity
          existingEquip.quantity += newEquip.quantity;
          existingEquip.certificationDate = newEquip.certificationDate || existingEquip.certificationDate;
          existingEquip.expiryDate = newEquip.expiryDate || existingEquip.expiryDate;
        } else {
          // Add new equipment
          armory.equipment.push({
            ...newEquip,
            certificationDate: newEquip.certificationDate || new Date()
          });
        }
      }
    }

    // Add operation log
    armory.comments.push({
      text: `Inventory updated by ${user.name}. Added ${body.weapons?.length || 0} weapons, ${body.ammunition?.length || 0} ammunition items, ${body.equipment?.length || 0} equipment items.`,
      category: 'inventory',
      updatedBy: user.name,
      updatedById: user._id,
      timestamp: new Date()
    });

    await armory.save();

    return NextResponse.json({
      success: true,
      armory,
      message: "Inventory updated successfully"
    });
    
  } catch (error) {
    console.error("Failed to update armory inventory:", error);
    return NextResponse.json(
      { error: "Failed to update armory inventory", details: error.message },
      { status: 500 }
    );
  }
}