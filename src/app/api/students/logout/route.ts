import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/firebase-db';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;

    if (token) {
      await deleteSession(token);
    }

    cookieStore.delete('student_token');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Student logout error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
