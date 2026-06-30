import { NextResponse } from 'next/server';
import { getKeys, createKey, getKeyByCode } from '@/lib/firebase-db';

export async function GET() {
  try {
    const keys = await getKeys();
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

    const code = customCode || (() => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let c = '';
      for (let i = 0; i < 4; i++) {
        if (i > 0) c += '-';
        for (let j = 0; j < 4; j++) c += chars[Math.floor(Math.random() * chars.length)];
      }
      return c;
    })();

    const key = await createKey({
      code,
      courseId,
      maxDevices: maxDevices || 1,
      durationDays: durationDays || 30
    });

    if (key.error) {
      return NextResponse.json({ error: key.error }, { status: 400 });
    }

    return NextResponse.json(key);
  } catch (error) {
    console.error('Key POST error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
