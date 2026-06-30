import { NextResponse } from 'next/server';
import { getKeyByCode, getKeyActivations } from '@/lib/firebase-db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, studentId, courseId } = body;

    if (!code || !studentId) {
      return NextResponse.json({ error: 'الكود وبيانات الطالب مطلوبة' }, { status: 400 });
    }

    const accessKey = await getKeyByCode(code);

    if (!accessKey) {
      return NextResponse.json({ valid: false, error: 'الكود غير صحيح' }, { status: 404 });
    }

    if (!accessKey.active) {
      return NextResponse.json({ valid: false, error: 'هذا الكود معطل' }, { status: 400 });
    }

    if (courseId && accessKey.courseId !== courseId) {
      return NextResponse.json({ valid: false, error: 'هذا الكود لا يعمل لهذا الكورس' }, { status: 400 });
    }

    // Check activations
    const activations = await getKeyActivations(accessKey.id);
    const activeActivations = activations.filter(a => new Date(a.expiresAt) > new Date());

    // Check if student already activated
    const existingActivation = activeActivations.find(a => a.studentId === studentId);
    if (existingActivation) {
      const courseSnap = await getCourse(accessKey.courseId);
      return NextResponse.json({
        valid: true,
        alreadyActive: true,
        expiresAt: existingActivation.expiresAt,
        course: courseSnap ? { title: courseSnap.title } : null
      });
    }

    // Check unique devices
    const uniqueDevices = new Set(activeActivations.map(a => a.fingerprint));
    if (uniqueDevices.size >= accessKey.maxDevices) {
      return NextResponse.json({ valid: false, error: `تم استخدام الكود على الحد الأقصى من الأجهزة (${accessKey.maxDevices})` }, { status: 400 });
    }

    const { getCourse } = await import('@/lib/firebase-db');
    const course = await getCourse(accessKey.courseId);

    return NextResponse.json({
      valid: true,
      canActivate: true,
      key: {
        id: accessKey.id,
        code: accessKey.code,
        maxDevices: accessKey.maxDevices,
        durationDays: accessKey.durationDays,
        usedDevices: uniqueDevices.size,
        course: course ? { title: course.title } : null
      }
    });
  } catch (error) {
    console.error('Key validate error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
