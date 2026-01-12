import { NextResponse } from 'next/server';
import  connectDB  from '@/lib/db'; 
import { authenticate} from '@/lib/auth';
import Armory from '@/models/Armory';

// GET /api/armories/[id] - Get single armory
export async function GET(request, { params }) {
  try {
    await connectDB();

    const {user} = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

     if (user.role !== "admin" && user.role !== "armourer") {
      return NextResponse.json(
        { error: "Insufficient permissions to access armory data" },
        { status: 403 }
      );
    }

    const { id } = await params; 
    const armory = await Armory.findById(id)
    if (!armory) {
      return NextResponse.json({ error: 'Armory not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, armory });
  } catch (error) {
    console.error('GET /api/armories/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/armories/[id] - Update armory inventory (add new items)
export async function PATCH(request, { params }) {
  try {
    await connectDB();

    // Authenticate user
    const {user} = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permissions
     if (user.role !== "admin" && user.role !== "armourer") {
        return NextResponse.json(
          { error: "Insufficient permissions to access armory data" },
          { status: 403 }
        );
      }
    const { id } =await params;

    // Parse and validate request body
    const body = await request.json();
    const { weapons, ammunition, equipment } = body;

    // Validate that at least one array is provided
    if (!weapons && !ammunition && !equipment) {
      return NextResponse.json(
        { error: 'No inventory data provided. Please provide weapons, ammunition, or equipment arrays.' },
        { status: 400 }
      );
    }

    // Find the existing armory
    const existingArmory = await Armory.findById(id);
    if (!existingArmory) {
      return NextResponse.json(
        { error: 'Armory not found' },
        { status: 404 }
      );
    }

    // Prepare update operations
    const updateOperations = {};
    const newItems = [];

    // Process weapons if provided
    if (weapons && Array.isArray(weapons)) {
      if (weapons.length > 0) {
        const weaponsWithCreator = weapons.map(weapon => ({
          ...weapon,
          createdBy: user.id,
          createdAt: new Date()
        }));
        
        updateOperations.$push = {
          ...updateOperations.$push,
          weapons: { $each: weaponsWithCreator }
        };
        newItems.push(`${weapons.length} weapon(s)`);
      }
    }

    // Process ammunition if provided
    if (ammunition && Array.isArray(ammunition)) {
      if (ammunition.length > 0) {
        const ammunitionWithCreator = ammunition.map(ammo => ({
          ...ammo,
          createdBy: user.id,
          createdAt: new Date()
        }));
        
        updateOperations.$push = {
          ...updateOperations.$push,
          ammunition: { $each: ammunitionWithCreator }
        };
        newItems.push(`${ammunition.length} ammunition item(s)`);
      }
    }

    // Process equipment if provided
    if (equipment && Array.isArray(equipment)) {
      if (equipment.length > 0) {
        const equipmentWithCreator = equipment.map(equip => ({
          ...equip,
          createdBy: user.id,
          createdAt: new Date()
        }));
        
        updateOperations.$push = {
          ...updateOperations.$push,
          equipment: { $each: equipmentWithCreator }
        };
        newItems.push(`${equipment.length} equipment item(s)`);
      }
    }

    // Add timestamp update
    updateOperations.$set = {
      updatedAt: new Date()
    };

    // Perform the update with atomic operations
    const updatedArmory = await Armory.findByIdAndUpdate(
      id,
      updateOperations,
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    )
    
    if (!updatedArmory) {
      return NextResponse.json(
        { error: 'Armory not found after update' },
        { status: 404 }
      );
    }

    // Create success message
    const message = newItems.length > 0 
      ? `Successfully added ${newItems.join(', ')} to armory inventory`
      : 'Armory inventory updated successfully';

    return NextResponse.json({
      success: true,
      message,
      armory: updatedArmory,
      addedItems: {
        weapons: weapons?.length || 0,
        ammunition: ammunition?.length || 0,
        equipment: equipment?.length || 0
      }
    });

  } catch (error) {
    console.error('PATCH /api/armories/[id] error:', error);

    // Handle specific error cases
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: Object.values(error.errors).map(err => err.message)
        },
        { status: 400 }
      );
    }

    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid armory ID format' },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate entry found' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/armories/[id] - Full armory update (existing function)
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

      if (user.role !== "admin" && user.role !== "armourer") {
         return NextResponse.json(
           { error: "Insufficient permissions to access armory data" },
           { status: 403 }
         );
       }
    const { id } =await params;
    const body = await request.json();

    // Validate required fields
    if (!body.armoryName || !body.armoryCode) {
      return NextResponse.json(
        { error: 'Armory name and code are required' },
        { status: 400 }
      );
    }

    const updatedArmory = await Armory.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    if (!updatedArmory) {
      return NextResponse.json({ error: 'Armory not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      armory: updatedArmory,
      message: 'Armory updated successfully'
    });
  } catch (error) {
    console.error('PUT /api/armories/[id] error:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/armories/[id] - Delete armory (existing function)
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const {user} = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "armourer") {
         return NextResponse.json(
           { error: "Insufficient permissions to access armory data" },
           { status: 403 }
         );
       }
    const { id } =await params;
    const armory = await Armory.findByIdAndDelete(id);

    if (!armory) {
      return NextResponse.json({ error: 'Armory not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Armory "${armory.armoryName}" deleted successfully`
    });
  } catch (error) {
    console.error('DELETE /api/armories/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}