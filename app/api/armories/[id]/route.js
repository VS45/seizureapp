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