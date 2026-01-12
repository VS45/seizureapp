import { NextResponse } from 'next/server';
import AmmunitionModel from '@/models/AmmunitionModel';
import connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';

// GET - Get all ammunition models
export async function GET(request) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "armourer") {
      return NextResponse.json(
        { error: "Insufficient permissions to access ammunition models" },
        { status: 403 }
      );
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const caliber = searchParams.get("caliber") || "";
    const status = searchParams.get("status") || "active";
    
    let query = { status };
    
    if (search) {
      query.$or = [
        { caliber: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (caliber) {
      query.caliber = caliber;
    }
    
    const models = await AmmunitionModel.find(query)
      .sort({ caliber: 1, type: 1 })
      .lean();
    
    // Get unique values for dropdowns
    const calibers = [...new Set(models.map(m => m.caliber))];
    const types = [...new Set(models.map(m => m.type))];
    
    return NextResponse.json({ 
      success: true,
      calibers,
      types,
      ammunitionModels: models,
      groupedModels: models.reduce((acc, model) => {
        if (!acc[model.caliber]) {
          acc[model.caliber] = [];
        }
        acc[model.caliber].push({
          id: model._id,
          type: model.type,
          manufacturer: model.manufacturer,
          description: model.description
        });
        return acc;
      }, {})
    });
  } catch (error) {
    console.error("Error fetching ammunition models:", error);
    return NextResponse.json({ 
      error: "Failed to fetch ammunition models", 
      details: error.message 
    }, { status: 500 });
  }
}

// POST - Create new ammunition model
export async function POST(request) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "armourer") {
      return NextResponse.json(
        { error: "Insufficient permissions to create ammunition models" },
        { status: 403 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    const {
      caliber,
      type,
      manufacturer,
      description
    } = body;

    // Validate required fields
    if (!caliber || !type || !manufacturer) {
      return NextResponse.json(
        { error: "Caliber, type, and manufacturer are required" },
        { status: 400 }
      );
    }

    // Check if ammunition model already exists
    const existingModel = await AmmunitionModel.findOne({
      caliber,
      type,
      manufacturer
    });

    if (existingModel) {
      return NextResponse.json(
        { error: "Ammunition model with this caliber, type and manufacturer already exists" },
        { status: 400 }
      );
    }

    // Create new ammunition model
    const ammunitionModel = new AmmunitionModel({
      caliber,
      type,
      manufacturer,
      description,
      status: 'active',
      createdBy: user._id,
      updatedBy: user._id
    });

    await ammunitionModel.save();

    return NextResponse.json({
      success: true,
      ammunitionModel,
      message: "Ammunition model created successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating ammunition model:", error);
    return NextResponse.json({ 
      error: "Failed to create ammunition model", 
      details: error.message 
    }, { status: 500 });
  }
}