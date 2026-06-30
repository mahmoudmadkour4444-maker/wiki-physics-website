import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const request = await db.accessRequest.update({
      where: { id },
      data: { status },
      include: { student: true, course: true }
    });

    return NextResponse.json(request);
  } catch (error) {
    console.error('Request PUT error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.accessRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Request DELETE error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
