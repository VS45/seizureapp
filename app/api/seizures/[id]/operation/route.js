// app/api/seizures/[id]/operation/route.js
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import Seizure from '@/models/Seizure';
import dbConnect from '@/lib/db';

export async function PATCH(request, { params }) {
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

    // Check user role permissions
    const userRole = authResult.user.role;
    console.log('User role:', userRole);
    
    // Allow admin, legal, valuation, validator, and initiator roles
    const allowedRoles = ['admin', 'legal', 'valuation', 'validator', 'initiator'];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { operation, comment, status, recommendation, dpv, images,gazetteNo } = await request.json();

    // Validate operation based on user role
    const adminOperations = ['Destruction', 'Auction', 'Gazette', 'Handover', 'Litigation', 'Donations'];
    const legalOperations = ['Gazette', 'Litigation'];
    const valuationOperations = ['Valuation'];
    const validatorOperations = ['Validation'];

    let allowedOperations = [];
    switch (userRole) {
      case 'admin':
        allowedOperations = adminOperations;
        break;
      case 'legal':
        allowedOperations = legalOperations;
        break;
      case 'valuation':
        allowedOperations = valuationOperations;
        break;
      case 'validator':
        allowedOperations = validatorOperations;
        break;
      case 'initiator':
        // Initiators might have limited operations or none
        allowedOperations = []; // Adjust as needed
        break;
      default:
        allowedOperations = [];
    }

    // Only validate operation if it's being changed and user has specific operations
    if (operation && allowedOperations.length > 0 && !allowedOperations.includes(operation)) {
      return NextResponse.json(
        { error: 'Operation not allowed for your role' },
        { status: 403 }
      );
    }

    // Get current seizure data
    const currentSeizure = await Seizure.findById(id);
    if (!currentSeizure) {
      return NextResponse.json(
        { error: 'Seizure not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {};
    
    if (operation) updateData.operation = operation;
    if (status) updateData.status = status;
    if (gazetteNo) updateData.gazetteNo = gazetteNo;
    if (recommendation) updateData.recommendation = recommendation;
    if (dpv !== undefined) updateData.dpv = dpv;
    console.log("check for images",images);
    // Add files if provided
    if (images && images.length > 0) {
      updateData.$push = {
        documents: {
          $each: images.map(fileUrl => ({ url: fileUrl }))
        }
      };
    }
    // Add comment to comments array
    const commentText = operation 
      ? `Operation changed from "${currentSeizure.operation || 'Not set'}" to "${operation}". Comment: ${comment}`
      : `Update: ${comment}`;

    updateData.$push = {
      ...updateData.$push,
      comments: {
        text: commentText,
        role: userRole,
        updatedBy: authResult.user.name,
        updatedById: authResult.user.id,
        timestamp: new Date()
      }
    };

    // Update the seizure
    const updatedSeizure = await Seizure.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    return NextResponse.json({
      message: 'Operation updated successfully',
      seizure: updatedSeizure
    });
  } catch (error) {
    console.error('Error updating operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}