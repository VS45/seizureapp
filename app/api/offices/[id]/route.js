import { NextResponse } from 'next/server';
import Office from '@/models/office';
import User from '@/models/User';
import connectDB from '@/lib/db';
// GET - Get single office
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const office = await Office.findById(id);
    
    if (!office) {
      return NextResponse.json(
        { error: 'Office not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(office);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch office', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update office
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const { name, code } = await request.json();

    // Validate input
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Check if office exists
    const existingOffice = await Office.findById(id);
    if (!existingOffice) {
      return NextResponse.json(
        { error: 'Office not found' },
        { status: 404 }
      );
    }

    // Check for duplicate name or code
    const duplicate = await Office.findOne({
      $and: [
        { _id: { $ne: id } }, // Exclude current office
        { $or: [{ name }, { code }] }
      ]
    });
    
    if (duplicate) {
      return NextResponse.json(
        { error: 'Office with this name or code already exists' },
        { status: 400 }
      );
    }

    // Update office
    const updatedOffice = await Office.findByIdAndUpdate(
      id,
      { name, code },
      { new: true }
    );

    return NextResponse.json(
      { message: 'Office updated successfully', office: updatedOffice }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update office', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove office
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    // Check if office is in use
    const usersWithOffice = await User.countDocuments({ office: id });
    if (usersWithOffice > 0) {
      return NextResponse.json(
        { error: 'Cannot delete office that is assigned to users' },
        { status: 400 }
      );
    }

    const deletedOffice = await Office.findByIdAndDelete(id);
    
    if (!deletedOffice) {
      return NextResponse.json(
        { error: 'Office not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Office deleted successfully' }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete office', details: error.message },
      { status: 500 }
    );
  }
}