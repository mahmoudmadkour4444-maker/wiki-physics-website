import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' }, { status: 400 });
    }

    const existing = await db.admin.findFirst();
    if (existing) {
      return NextResponse.json({ error: 'يوجد حساب أدمن بالفعل' }, { status: 400 });
    }

    const admin = await db.admin.create({
      data: { username, password }
    });

    return NextResponse.json({ success: true, admin: { id: admin.id, username: admin.username } });
  } catch (error) {
    console.error('Admin init error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
