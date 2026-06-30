import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const course = await db.course.findUnique({
      where: { id },
      include: { 
        lessons: { orderBy: { order: 'asc' } },
        keys: { include: { activations: true } },
        requests: { include: { student: true }, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'الكورس غير موجود' }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Course GET error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const course = await db.course.update({
      where: { id },
      data: body
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error('Course PUT error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.course.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Course DELETE error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
