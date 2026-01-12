import { NextResponse } from 'next/server';
import WeaponModel from '@/models/WeaponModel';
import connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';

// GET single weapon model
export async function GET(request, { params }) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "armourer") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await connectDB();
    
    const { id } = await params;
    const weaponModel = await WeaponModel.findById(id);

    if (!weaponModel) {
      return NextResponse.json(
        { error: "Weapon model not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      weaponModel
    });
  } catch (error) {
    console.error("Error fetching weapon model:", error);
    return NextResponse.json({ 
      error: "Failed to fetch weapon model", 
      details: error.message 
    }, { status: 500 });
  }
}

// PUT - Update weapon model
export async function PUT(request, { params }) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "armourer") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await connectDB();
    
    const { id } = await params;
    const body = await request.json();

    const weaponModel = await WeaponModel.findById(id);
    if (!weaponModel) {
      return NextResponse.json(
        { error: "Weapon model not found" },
        { status: 404 }
      );
    }

    // Check for duplicate (excluding current model)
    const duplicate = await WeaponModel.findOne({
      weaponType: body.weaponType,
      model: body.model,
      _id: { $ne: id }
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "Another weapon model with this type and model already exists" },
        { status: 400 }
      );
    }

    // Update model
    weaponModel.weaponType = body.weaponType;
    weaponModel.model = body.model;
    weaponModel.manufacturer = body.manufacturer;
    weaponModel.updatedAt = new Date();

    await weaponModel.save();

    return NextResponse.json({
      success: true,
      weaponModel,
      message: "Weapon model updated successfully"
    });

  } catch (error) {
    console.error("Error updating weapon model:", error);
    return NextResponse.json({ 
      error: "Failed to update weapon model", 
      details: error.message 
    }, { status: 500 });
  }
}

// PATCH - Partial update (status change)
export async function PATCH(request, { params }) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "armourer") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await connectDB();
    
    const { id } = await params;
    const body = await request.json();

    const weaponModel = await WeaponModel.findById(id);
    if (!weaponModel) {
      return NextResponse.json(
        { error: "Weapon model not found" },
        { status: 404 }
      );
    }

    // Update only allowed fields
    if (body.status !== undefined) {
      weaponModel.status = body.status;
    }
    
    if (body.weaponType !== undefined) {
      weaponModel.weaponType = body.weaponType;
    }
    
    if (body.model !== undefined) {
      weaponModel.model = body.model;
    }
    
    if (body.manufacturer !== undefined) {
      weaponModel.manufacturer = body.manufacturer;
    }
    
    weaponModel.updatedAt = new Date();

    await weaponModel.save();

    return NextResponse.json({
      success: true,
      weaponModel,
      message: "Weapon model updated successfully"
    });

  } catch (error) {
    console.error("Error updating weapon model:", error);
    return NextResponse.json({ 
      error: "Failed to update weapon model", 
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE - Delete weapon model
export async function DELETE(request, { params }) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Only admin can delete models
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions. Only admin can delete weapon models." },
        { status: 403 }
      );
    }

    await connectDB();
    
    const { id } = await params;
    const weaponModel = await WeaponModel.findById(id);

    if (!weaponModel) {
      return NextResponse.json(
        { error: "Weapon model not found" },
        { status: 404 }
      );
    }

    // Check if model is being used in any armory
    // You might want to add this check if you have references

    await WeaponModel.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Weapon model deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting weapon model:", error);
    return NextResponse.json({ 
      error: "Failed to delete weapon model", 
      details: error.message 
    }, { status: 500 });
  }
}