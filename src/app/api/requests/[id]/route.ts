import { NextResponse } from 'next/server';
import { updateRequest, deleteRequest } from '@/lib/firebase-db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const request = await updateRequest(id, body);
    return NextResponse.json(request);
  } catch (error) {
    console.error('Request PUT error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteRequest(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Request DELETE error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
