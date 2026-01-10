import { NextResponse } from 'next/server';
import  connectDB  from '@/lib/db';
import { authenticate } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const user = await authenticate(request);
    
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('GET /api/auth/me error:', error);
    return NextResponse.json({ user: null });
  }
}