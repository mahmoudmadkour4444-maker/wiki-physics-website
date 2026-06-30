import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdmin, adminExists, createAdmin } from '@/lib/firebase-db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' }, { status: 400 });
    }

    // Auto-create default admin if none exists
    const hasAdmin = await adminExists();
    if (!hasAdmin) {
      await createAdmin('admin', 'admin123');
    }

    const admin = await getAdmin(username, password);

    if (!admin) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }

    const token = `admin_${admin.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });

    return NextResponse.json({ success: true, admin: { id: admin.id, username: admin.username }, token });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'حدث خطأ في تسجيل الدخول' }, { status: 500 });
  }
}
