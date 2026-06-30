import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findStudentByPhone, findStudentByUsername, createStudent, updateStudent, createSession, getStudentActivations } from '@/lib/firebase-db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, name, username, password, phone, whatsapp, stage, fingerprint } = body;

    // ========== REGISTER ==========
    if (action === 'register') {
      if (!name || !username || !password || !phone || !stage) {
        return NextResponse.json({ error: 'جميع البيانات مطلوبة' }, { status: 400 });
      }

      // Check if username already exists
      const existingUser = await findStudentByUsername(username);
      if (existingUser) {
        return NextResponse.json({ error: 'اسم المستخدم موجود بالفعل' }, { status: 400 });
      }

      // Create student
      const student = await createStudent({
        name,
        username,
        password,
        phone,
        whatsapp: whatsapp || phone,
        stage,
        fingerprint: fingerprint || undefined
      });

      // Create session
      const token = `student_${student.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await createSession({
        studentId: student.id,
        token,
        fingerprint: fingerprint || 'unknown',
        deviceInfo: body.deviceInfo || 'unknown',
        expiresAt
      });

      const cookieStore = await cookies();
      cookieStore.set('student_token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30
      });

      const activations = await getStudentActivations(student.id);
      const activeCourses = activations
        .filter(a => new Date(a.expiresAt) > new Date())
        .map(a => ({
          courseId: a.accessKey?.courseId,
          courseTitle: a.accessKey?.course?.title,
          expiresAt: a.expiresAt
        }));

      return NextResponse.json({
        success: true,
        student: { id: student.id, name: student.name, username: student.username, stage: student.stage },
        activeCourses
      });
    }

    // ========== LOGIN ==========
    if (action === 'login') {
      if (!username || !password) {
        return NextResponse.json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' }, { status: 400 });
      }

      const student = await findStudentByUsername(username);
      if (!student) {
        return NextResponse.json({ error: 'اسم المستخدم غير موجود' }, { status: 400 });
      }

      if ((student as any).password !== password) {
        return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 400 });
      }

      // Create session
      const token = `student_${student.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await createSession({
        studentId: student.id,
        token,
        fingerprint: fingerprint || 'unknown',
        deviceInfo: body.deviceInfo || 'unknown',
        expiresAt
      });

      const cookieStore = await cookies();
      cookieStore.set('student_token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30
      });

      const activations = await getStudentActivations(student.id);
      const activeCourses = activations
        .filter(a => new Date(a.expiresAt) > new Date())
        .map(a => ({
          courseId: a.accessKey?.courseId,
          courseTitle: a.accessKey?.course?.title,
          expiresAt: a.expiresAt
        }));

      return NextResponse.json({
        success: true,
        student: { id: student.id, name: student.name, username: (student as any).username, stage: (student as any).stage },
        activeCourses
      });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error) {
    console.error('Student auth error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
