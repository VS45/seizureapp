import { NextResponse } from 'next/server';
import WeaponModel from '@/models/WeaponModel';
import connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';

// GET - Get all weapon models (with optional filters)
export async function GET(request) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check permissions
    if (user.role !== "admin" && user.role !== "armourer") {
      return NextResponse.json(
        { error: "Insufficient permissions to access weapon models" },
        { status: 403 }
      );
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const weaponType = searchParams.get("weaponType") || "";
    const status = searchParams.get("status") || "active";
    
    // Build query
    let query = { status };
    
    if (search) {
      query.$or = [
        { model: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { caliber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (weaponType) {
      query.weaponType = weaponType;
    }
    
    const models = await WeaponModel.find(query)
      .sort({ weaponType: 1, model: 1 })
      .lean();
    
    // Group by weapon type for dropdown
    const groupedModels = models.reduce((acc, model) => {
      if (!acc[model.weaponType]) {
        acc[model.weaponType] = [];
      }
      acc[model.weaponType].push({
        id: model._id,
        model: model.model,
        manufacturer: model.manufacturer,
      });
      return acc;
    }, {});
    
    return NextResponse.json({ 
      success: true,
      weaponModels: groupedModels,
      allModels: models,
      weaponTypes: Object.keys(groupedModels)
    });
  } catch (error) {
    console.error("Error fetching weapon models:", error);
    return NextResponse.json({ 
      error: "Failed to fetch weapon models", 
      details: error.message 
    }, { status: 500 });
  }
}

// POST - Create new weapon model
export async function POST(request) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Only admin and armourer can create weapon models
    if (user.role !== "admin" && user.role !== "armourer") {
      return NextResponse.json(
        { error: "Insufficient permissions to create weapon models" },
        { status: 403 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    const {
      weaponType,
      model,
      manufacturer,
    } = body;

    // Validate required fields
    if (!weaponType || !model || !manufacturer) {
      return NextResponse.json(
        { error: "Weapon type, model, and manufacturer are required" },
        { status: 400 }
      );
    }

    // Check if weapon model already exists
    const existingModel = await WeaponModel.findOne({
      weaponType,
      model,
      manufacturer
    });

    if (existingModel) {
      return NextResponse.json(
        { error: "Weapon model with this type, model and manufacturer already exists" },
        { status: 400 }
      );
    }

    // Create new weapon model
    const weaponModel = new WeaponModel({
      weaponType,
      model,
      manufacturer,
      status: 'active',
      createdBy: user._id,
      updatedBy: user._id
    });

    await weaponModel.save();
    return NextResponse.json({
      success: true,
      weaponModel,
      message: "Weapon model created successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating weapon model:", error);
    return NextResponse.json({ 
      error: "Failed to create weapon model", 
      details: error.message 
    }, { status: 500 });
  }
}