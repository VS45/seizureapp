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
        { error: "Insufficient permissions to access equipment models" },
        { status: 403 }
      );
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "active";
    
    let query = { status };
    
    if (search) {
      query.$or = [
        { itemType: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    const models = await EquipmentModel.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ category: 1, itemType: 1 })
      .lean();
    
    // Group by category for dropdown
    const groupedModels = models.reduce((acc, model) => {
      if (!acc[model.category]) {
        acc[model.category] = [];
      }
      acc[model.category].push({
        id: model._id,
        itemType: model.itemType,
        manufacturer: model.manufacturer,
        model: model.model,
        sizes: model.sizes,
        description: model.description
      });
      return acc;
    }, {});
    
    // Get all categories
    const categories = [...new Set(models.map(m => m.category))];
    
    return NextResponse.json({ 
      success: true,
      equipmentModels: groupedModels,
      allModels: models,
      categories
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
        { error: "Insufficient permissions to create equipment models" },
        { status: 403 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    const {
      itemType,
      category,
      manufacturer,
      model,
      sizes,
      weight,
      color,
      material,
      protectionLevel,
      batteryLife,
      warrantyPeriod,
      maintenanceInterval,
      description
    } = body;

    // Validate required fields
    if (!itemType || !category || !manufacturer) {
      return NextResponse.json(
        { error: "Item type, category, and manufacturer are required" },
        { status: 400 }
      );
    }

    // Check if equipment model already exists
    const existingModel = await EquipmentModel.findOne({
      itemType,
      manufacturer
    });

    if (existingModel) {
      return NextResponse.json(
        { error: "Equipment model with this item type and manufacturer already exists" },
        { status: 400 }
      );
    }

    // Create new equipment model
    const equipmentModel = new EquipmentModel({
      itemType,
      category,
      manufacturer,
      model,
      sizes: sizes || [],
      weight,
      color,
      material,
      protectionLevel: protectionLevel || 'N/A',
      batteryLife,
      warrantyPeriod,
      maintenanceInterval,
      description,
      status: 'active',
      createdBy: user._id,
      updatedBy: user._id
    });

    await equipmentModel.save();

    await equipmentModel.populate('createdBy', 'name email');
    await equipmentModel.populate('updatedBy', 'name email');

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