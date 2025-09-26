import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/auth';

export async function POST(request) {
  const token = request.cookies.get('token')?.value;
  
  if (token) {
    // Log activity
    const ip = request.headers.get('x-forwarded-for') || request.ip;
    const userAgent = request.headers.get('user-agent');
    await logActivity(null, 'logout', ip, userAgent);
  }
  
  const response = NextResponse.json({ message: 'Logout successful' });
  response.cookies.delete('token');
  return response;
}