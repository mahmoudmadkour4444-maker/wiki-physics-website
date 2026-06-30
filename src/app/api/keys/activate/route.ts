import { NextResponse } from 'next/server';
import { getKeyByCode, getKeyActivations, createActivation, getCourse } from '@/lib/firebase-db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, studentId, fingerprint } = body;

    if (!code || !studentId) {
      return NextResponse.json({ error: 'الكود وبيانات الطالب مطلوبة' }, { status: 400 });
    }

    const accessKey = await getKeyByCode(code);

    if (!accessKey || !accessKey.active) {
      return NextResponse.json({ error: 'الكود غير صالح' }, { status: 400 });
    }

    // Check activations
    const activations = await getKeyActivations(accessKey.id);
    const activeActivations = activations.filter(a => new Date(a.expiresAt) > new Date());

    // Check if already activated for this student
    const existing = activeActivations.find(a => a.studentId === studentId);
    if (existing) {
      const course = await getCourse(accessKey.courseId);
      return NextResponse.json({
        success: true,
        message: 'تم تفعيل الكود مسبقاً',
        expiresAt: existing.expiresAt,
        course: course ? { title: course.title } : null
      });
    }

    // Check device count
    const uniqueDevices = new Set(activeActivations.map(a => a.fingerprint));
    if (uniqueDevices.size >= accessKey.maxDevices) {
      return NextResponse.json({ error: `تم استخدام الكود على الحد الأقصى من الأجهزة (${accessKey.maxDevices})` }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + accessKey.durationDays * 24 * 60 * 60 * 1000).toISOString();

    await createActivation({
      keyId: accessKey.id,
      studentId,
      fingerprint: fingerprint || 'unknown',
      expiresAt
    });

    const course = await getCourse(accessKey.courseId);

    return NextResponse.json({
      success: true,
      message: 'تم تفعيل الكود بنجاح!',
      expiresAt,
      course: course ? { title: course.title } : null
    });
  } catch (error) {
    console.error('Key activate error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
