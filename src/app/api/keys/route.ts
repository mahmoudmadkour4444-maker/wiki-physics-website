import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    if (i > 0) code += '-';
    for (let j = 0; j < 4; j++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return code;
}

export async function GET() {
  try {
    const keys = await db.accessKey.findMany({
      include: {
        course: { select: { title: true } },
        activations: { include: { student: { select: { name: true, phone: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(keys);
  } catch (error) {
    console.error('Keys GET error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseId, maxDevices, durationDays, code: customCode } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'الكورس مطلوب' }, { status: 400 });
    }

    const code = customCode || generateCode();

    // Ensure unique code
    const existing = await db.accessKey.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'هذا الكود موجود بالفعل' }, { status: 400 });
    }

    const key = await db.accessKey.create({
      data: {
        code,
        courseId,
        maxDevices: maxDevices || 1,
        durationDays: durationDays || 30
      },
      include: { course: true }
    });

    return NextResponse.json(key);
  } catch (error) {
    console.error('Key POST error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
