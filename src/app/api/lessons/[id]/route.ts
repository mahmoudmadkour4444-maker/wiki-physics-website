import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lesson = await db.lesson.findUnique({
      where: { id },
      include: { course: true }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'الدرس غير موجود' }, { status: 404 });
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Lesson GET error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const lesson = await db.lesson.update({
      where: { id },
      data: body
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Lesson PUT error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.lesson.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lesson DELETE error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
