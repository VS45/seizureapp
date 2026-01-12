import { NextResponse } from 'next/server';
import EquipmentModel from '@/models/EquipmentModel';
import connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';

// GET - Get all equipment models
export async function GET(request) {
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
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "active";
    
    let query = { status };
    
    if (search) {
      query.itemType = { $regex: search, $options: 'i' };
    }
    
    const models = await EquipmentModel.find(query)
      .sort({ itemType: 1 })
      .lean();
    
    return NextResponse.json({ 
      success: true,
      equipmentModels: models.map(model => ({
        id: model._id,
        itemType: model.itemType
      }))
    });
  } catch (error) {
    console.error("Error fetching equipment models:", error);
    return NextResponse.json({ 
      error: "Failed to fetch equipment models", 
      details: error.message 
    }, { status: 500 });
  }
}

// POST - Create new equipment model
export async function POST(request) {
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
    
    const body = await request.json();
    const { itemType } = body;

    if (!itemType) {
      return NextResponse.json(
        { error: "Item type is required" },
        { status: 400 }
      );
    }

    const existingModel = await EquipmentModel.findOne({
      itemType
    });

    if (existingModel) {
      return NextResponse.json(
        { error: "Equipment model with this item type already exists" },
        { status: 400 }
      );
    }

    const equipmentModel = new EquipmentModel({
      itemType,
      status: 'active'
    });

    await equipmentModel.save();

    return NextResponse.json({
      success: true,
      equipmentModel,
      message: "Equipment model created successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating equipment model:", error);
    return NextResponse.json({ 
      error: "Failed to create equipment model", 
      details: error.message 
    }, { status: 500 });
  }
}