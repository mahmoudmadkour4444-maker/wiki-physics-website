import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const admin = await db.admin.findFirst();
    if (!admin) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    if (!token.startsWith(`admin_${admin.id}_`)) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, admin: { id: admin.id, username: admin.username } });
  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
