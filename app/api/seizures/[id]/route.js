// app/api/seizures/[id]/route.js
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import Seizure from '@/models/Seizure';
import dbConnect from '@/lib/db';

export async function GET(request, { params }) {
  try {
      const { id } = await params;
    // Authenticate user using JWT
    const authResult = await authenticate(request);
    
    if (!authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    await dbConnect();
    
    const seizure = await Seizure.findById(id);
    
    if (!seizure) {
      return NextResponse.json(
        { error: 'Seizure not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(seizure);
  } catch (error) {
    console.error('Error fetching seizure:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
        const { id } = await params;
    // Authenticate user using JWT
    const authResult = await authenticate(request);
    
    if (!authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    
    // Find and update the seizure
    const updatedSeizure = await Seizure.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );
    
    if (!updatedSeizure) {
      return NextResponse.json(
        { error: 'Seizure not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Seizure updated successfully', 
      seizure: updatedSeizure 
    });
  } catch (error) {
    console.error('Error updating seizure:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
        const { id } = await params;
    // Authenticate user using JWT (only admin should be able to delete)
    const authResult = await authenticate(request);
    
    if (!authResult.user || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    await dbConnect();
    
    const deletedSeizure = await Seizure.findByIdAndDelete(id);
    
    if (!deletedSeizure) {
      return NextResponse.json(
        { error: 'Seizure not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Seizure deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting seizure:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}