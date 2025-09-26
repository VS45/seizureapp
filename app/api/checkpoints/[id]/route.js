import { NextResponse } from 'next/server';
import Checkpoint from '@/models/Checkpoint';
import connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
         const { id } = await params;
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    const checkpoint = await Checkpoint.findById(id).populate('user', 'name email');
    
    if (!checkpoint) {
      return NextResponse.json({ error: "Checkpoint not found" }, { status: 404 });
    }

    // Check if user has access to this checkpoint
    if (user.role !== 'admin' && checkpoint.user._id.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ success: true, checkpoint });
  } catch (error) {
    console.error("Failed to fetch checkpoint:", error);
    return NextResponse.json(
      { error: "Failed to fetch checkpoint", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
     const { id } = await params;
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { name, description } = body;

    const checkpoint = await Checkpoint.findById(id);
    
    if (!checkpoint) {
      return NextResponse.json({ error: "Checkpoint not found" }, { status: 404 });
    }

    // Check if user has access to this checkpoint
    if (user.role !== 'admin' && checkpoint.user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check for duplicate name
    const existingCheckpoint = await Checkpoint.findOne({
      _id: { $ne: id },
      user: user._id,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingCheckpoint) {
      return NextResponse.json(
        { error: "Checkpoint with this name already exists" },
        { status: 400 }
      );
    }

    checkpoint.name = name;
    checkpoint.description = description;
    await checkpoint.save();

    await checkpoint.populate('user', 'name email');

    return NextResponse.json({
      success: true,
      checkpoint,
      message: "Checkpoint updated successfully"
    });
  } catch (error) {
    console.error("Failed to update checkpoint:", error);
    return NextResponse.json(
      { error: "Failed to update checkpoint", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
     const { id } = await params;
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    const checkpoint = await Checkpoint.findById(id);
    
    if (!checkpoint) {
      return NextResponse.json({ error: "Checkpoint not found" }, { status: 404 });
    }

    // Check if user has access to this checkpoint
    if (user.role !== 'admin' && checkpoint.user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await Checkpoint.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Checkpoint deleted successfully"
    });
  } catch (error) {
    console.error("Failed to delete checkpoint:", error);
    return NextResponse.json(
      { error: "Failed to delete checkpoint", details: error.message },
      { status: 500 }
    );
  }
}