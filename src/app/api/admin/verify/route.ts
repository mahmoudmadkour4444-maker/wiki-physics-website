import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminExists } from '@/lib/firebase-db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const hasAdmin = await adminExists();
    if (!hasAdmin) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    if (!token.startsWith('admin_')) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Extract admin ID from token
    const parts = token.split('_');
    const adminId = parts[1];

    return NextResponse.json({ authenticated: true, admin: { id: adminId, username: 'admin' } });
  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
