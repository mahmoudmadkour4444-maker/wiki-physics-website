import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const students = await db.student.findMany({
      include: {
        _count: { select: { sessions: true, requests: true, activations: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(students);
  } catch (error) {
    console.error('Students GET error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, whatsapp, stage, year, fingerprint } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'الاسم ورقم الهاتف مطلوبان' }, { status: 400 });
    }

    // Check if student exists
    let student = await db.student.findFirst({ where: { phone } });
    
    if (student) {
      // Update existing student
      student = await db.student.update({
        where: { id: student.id },
        data: { name, whatsapp, stage, year, fingerprint }
      });
    } else {
      student = await db.student.create({
        data: { name, phone, whatsapp: whatsapp || phone, stage: stage || '', year: year || '', fingerprint: fingerprint || null }
      });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error('Student POST error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
