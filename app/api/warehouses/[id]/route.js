import { NextResponse } from 'next/server';
import Warehouse from '@/models/Warehouse';
import connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    const warehouse = await Warehouse.findById(params.id).populate('user', 'name email');
    
    if (!warehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    // Check if user has access to this warehouse
    if (user.role !== 'admin' && warehouse.user._id.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ success: true, warehouse });
  } catch (error) {
    console.error("Failed to fetch warehouse:", error);
    return NextResponse.json(
      { error: "Failed to fetch warehouse", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { name, description } = body;

    const warehouse = await Warehouse.findById(params.id);
    
    if (!warehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    // Check if user has access to this warehouse
    if (user.role !== 'admin' && warehouse.user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check for duplicate name
    const existingWarehouse = await Warehouse.findOne({
      _id: { $ne: params.id },
      user: user._id,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingWarehouse) {
      return NextResponse.json(
        { error: "Warehouse with this name already exists" },
        { status: 400 }
      );
    }

    warehouse.name = name;
    warehouse.description = description;
    await warehouse.save();

    await warehouse.populate('user', 'name email');

    return NextResponse.json({
      success: true,
      warehouse,
      message: "Warehouse updated successfully"
    });
  } catch (error) {
    console.error("Failed to update warehouse:", error);
    return NextResponse.json(
      { error: "Failed to update warehouse", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    const warehouse = await Warehouse.findById(params.id);
    
    if (!warehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    // Check if user has access to this warehouse
    if (user.role !== 'admin' && warehouse.user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await Warehouse.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: "Warehouse deleted successfully"
    });
  } catch (error) {
    console.error("Failed to delete warehouse:", error);
    return NextResponse.json(
      { error: "Failed to delete warehouse", details: error.message },
      { status: 500 }
    );
  }
}