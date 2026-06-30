import { NextResponse } from 'next/server';
import { getStudentInbox, getUnreadInboxCount, markInboxRead } from '@/lib/firebase-db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId مطلوب' }, { status: 400 });
    }

    const action = searchParams.get('action');

    if (action === 'unread') {
      const count = await getUnreadInboxCount(studentId);
      return NextResponse.json({ count });
    }

    const messages = await getStudentInbox(studentId);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Inbox GET error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { messageId } = await req.json();
    if (!messageId) {
      return NextResponse.json({ error: 'messageId مطلوب' }, { status: 400 });
    }
    await markInboxRead(messageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Inbox PUT error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
