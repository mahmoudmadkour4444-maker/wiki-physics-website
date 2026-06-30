import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/firebase-db';

export async function GET() {
  try {
    const data = await getDashboardStats();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
