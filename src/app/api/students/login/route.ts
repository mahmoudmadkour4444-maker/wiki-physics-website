import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findStudentByPhone, createStudent, updateStudent, createSession, getStudentActivations } from '@/lib/firebase-db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, whatsapp, stage, year, fingerprint } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'الاسم ورقم الهاتف مطلوبان' }, { status: 400 });
    }

    // Find or create student
    let student = await findStudentByPhone(phone);

    if (student) {
      student = await updateStudent(student.id, {
        name,
        whatsapp: whatsapp || phone,
        stage: stage || '',
        year: year || '',
        fingerprint: fingerprint || student.fingerprint
      });
    } else {
      student = await createStudent({
        name,
        phone,
        whatsapp: whatsapp || phone,
        stage: stage || '',
        year: year || '',
        fingerprint: fingerprint || undefined
      });
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

    // Get student's active access
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
      student: { id: student.id, name: student.name, phone: student.phone },
      activeCourses
    });
  } catch (error) {
    console.error('Student login error:', error);
    return NextResponse.json({ error: 'حدث خطأ في تسجيل الدخول' }, { status: 500 });
  }
}
