// app/api/users/[id]/route.js
import { NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { authenticate } from '@/lib/auth';
import Office from '@/models/office';

export async function PUT(request, { params }) {
  try {
    // Authenticate user
    const { user: authUser } = await authenticate(request);

    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user has admin role
    if (authUser.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    const { id } = await params;

    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { name, rank, officeCode, role } = body;
    console.log(body)
    console.log(id)

    // Validate required fields
    if (!name || !rank || !officeCode || !role) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }
const office=await Office.findOne({code:officeCode});
    if (!office) {
      return NextResponse.json(
        { error: "Office not found with the provided code" },
        { status: 404 }
      );
    }
    // Find user and update
    const user = await User.findByIdAndUpdate(
      id,
      { 
        name, 
        rank: rank.toUpperCase(), 
        office, 
        role 
      },
      { new: true, runValidators: true }
    )
    .populate('office', 'name code')
    .select('-password -verificationToken -verificationTokenExpires');

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
      message: "User updated successfully"
    });
  } catch (error) {
    console.log("Failed to update user:", error);
    return NextResponse.json(
      { error: "Failed to update user", details: error.message },
      { status: 500 }
    );
  }
}

// app/api/users/[id]/route.js
export async function DELETE(request, { params }) {
  try {
    // Authenticate user
    const { user: authUser } = await authenticate(request);

    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user has admin role
    if (authUser.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    const { id } = params;

    // Prevent admin from deleting themselves
    if (id === authUser._id.toString()) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user", details: error.message },
      { status: 500 }
    );
  }
}

// app/api/users/[id]/route.js
export async function PATCH(request, { params }) {
  try {
    // Authenticate user
    const { user: authUser } = await authenticate(request);

    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user has admin role
    if (authUser.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    const { id } = params;

    // Prevent admin from deactivating themselves
    if (id === authUser._id.toString()) {
      return NextResponse.json(
        { error: "Cannot modify your own account status" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { isVerified } = body;

    // Validate required field
    if (typeof isVerified !== 'boolean') {
      return NextResponse.json(
        { error: "isVerified field is required and must be a boolean" },
        { status: 400 }
      );
    }

    // Find user and update only the isActive field
    const user = await User.findByIdAndUpdate(
      id,
      { isVerified },
      { new: true, runValidators: true }
    )
    .populate('office', 'name code')
    .select('-password -verificationToken -verificationTokenExpires');

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
      message: `User ${isVerified ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error("Failed to update user status:", error);
    return NextResponse.json(
      { error: "Failed to update user status", details: error.message },
      { status: 500 }
    );
  }
}