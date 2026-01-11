import { NextResponse } from 'next/server';
import Office from '@/models/office';
import connectDB from '@/lib/db';

// GET - List all offices api/offices
export async function GET() {
  try {
    await connectDB();
    const offices = await Office.find().sort({ name: 1 });
    return NextResponse.json(offices);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch offices', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new office
export async function POST(request) {
  try {
    await connectDB();
    const { name, code } = await request.json();

    // Validate input
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Check if office already exists
    const existingOffice = await Office.findOne({ 
      $or: [{ name }, { code }] 
    });
    
    if (existingOffice) {
      return NextResponse.json(
        { error: 'Office with this name or code already exists' },
        { status: 400 }
      );
    }

    // Create new office
    const office = new Office({ name, code });
    await office.save();

    return NextResponse.json(
      { message: 'Office created successfully', office },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create office', details: error.message },
      { status: 500 }
    );
  }
}

