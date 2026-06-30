import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, studentId, courseId } = body;

    if (!code || !studentId) {
      return NextResponse.json({ error: 'الكود وبيانات الطالب مطلوبة' }, { status: 400 });
    }

    const accessKey = await db.accessKey.findUnique({
      where: { code },
      include: {
        course: true,
        activations: true
      }
    });

    if (!accessKey) {
      return NextResponse.json({ valid: false, error: 'الكود غير صحيح' }, { status: 404 });
    }

    if (!accessKey.active) {
      return NextResponse.json({ valid: false, error: 'هذا الكود معطل' }, { status: 400 });
    }

    if (courseId && accessKey.courseId !== courseId) {
      return NextResponse.json({ valid: false, error: 'هذا الكود لا يعمل لهذا الكورس' }, { status: 400 });
    }

    // Check if student already has access
    const existingActivation = await db.keyActivation.findFirst({
      where: { keyId: accessKey.id, studentId, expiresAt: { gt: new Date() } }
    });

    if (existingActivation) {
      return NextResponse.json({ 
        valid: true, 
        alreadyActive: true,
        expiresAt: existingActivation.expiresAt,
        course: accessKey.course
      });
    }

    // Check device count
    const activeActivations = await db.keyActivation.findMany({
      where: { keyId: accessKey.id, expiresAt: { gt: new Date() } }
    });

    // Get unique fingerprints
    const uniqueDevices = new Set(activeActivations.map(a => a.fingerprint));

    if (uniqueDevices.size >= accessKey.maxDevices) {
      return NextResponse.json({ valid: false, error: `تم استخدام الكود على الحد الأقصى من الأجهزة (${accessKey.maxDevices})` }, { status: 400 });
    }

    return NextResponse.json({ 
      valid: true, 
      canActivate: true,
      key: {
        id: accessKey.id,
        code: accessKey.code,
        maxDevices: accessKey.maxDevices,
        durationDays: accessKey.durationDays,
        usedDevices: uniqueDevices.size,
        course: accessKey.course
      }
    });
  } catch (error) {
    console.error('Key validate error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
