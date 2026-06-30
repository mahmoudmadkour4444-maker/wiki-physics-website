import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, studentId, fingerprint } = body;

    if (!code || !studentId) {
      return NextResponse.json({ error: 'الكود وبيانات الطالب مطلوبة' }, { status: 400 });
    }

    const accessKey = await db.accessKey.findUnique({
      where: { code },
      include: { course: true, activations: true }
    });

    if (!accessKey || !accessKey.active) {
      return NextResponse.json({ error: 'الكود غير صالح' }, { status: 400 });
    }

    // Check if already activated for this student
    const existing = await db.keyActivation.findFirst({
      where: { keyId: accessKey.id, studentId, expiresAt: { gt: new Date() } }
    });

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: 'تم تفعيل الكود مسبقاً',
        expiresAt: existing.expiresAt,
        course: accessKey.course
      });
    }

    // Check device count
    const activeActivations = await db.keyActivation.findMany({
      where: { keyId: accessKey.id, expiresAt: { gt: new Date() } }
    });
    const uniqueDevices = new Set(activeActivations.map(a => a.fingerprint));

    if (uniqueDevices.size >= accessKey.maxDevices) {
      return NextResponse.json({ error: `تم استخدام الكود على الحد الأقصى من الأجهزة (${accessKey.maxDevices})` }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + accessKey.durationDays * 24 * 60 * 60 * 1000);

    const activation = await db.keyActivation.create({
      data: {
        keyId: accessKey.id,
        studentId,
        fingerprint: fingerprint || 'unknown',
        expiresAt
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'تم تفعيل الكود بنجاح!',
      expiresAt: activation.expiresAt,
      course: accessKey.course
    });
  } catch (error) {
    console.error('Key activate error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
