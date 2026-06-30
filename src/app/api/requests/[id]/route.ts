import { NextResponse } from 'next/server';
import { updateRequest, deleteRequest, getStudent, getCourse, createKey, createInboxMessage } from '@/lib/firebase-db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    // Update the request status
    const request = await updateRequest(id, body);

    // If approved, generate a key code and send it to the student's inbox
    if (status === 'approved') {
      const fullRequest = await (async () => {
        // Get the full request with student/course data
        const { getRequests } = await import('@/lib/firebase-db');
        const allRequests = await getRequests();
        return allRequests.find((r: any) => r.id === id);
      })();

      if (fullRequest) {
        const studentId = (fullRequest as any).studentId;
        const courseId = (fullRequest as any).courseId;
        const studentName = (fullRequest as any).student?.name || 'طالب';
        const courseTitle = (fullRequest as any).course?.title || 'كورس';

        // Generate a random key code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 4; i++) {
          if (i > 0) code += '-';
          for (let j = 0; j < 4; j++) code += chars[Math.floor(Math.random() * chars.length)];
        }

        // Create the key in the database
        const key = await createKey({
          code,
          courseId,
          maxDevices: 1,
          durationDays: 30
        });

        // Send the code to the student's inbox
        if (!key.error) {
          await createInboxMessage({
            studentId,
            title: `كود تفعيل كورس ${courseTitle}`,
            body: `مرحباً ${studentName}! تم قبول طلبك لكورس "${courseTitle}". كود التفعيل الخاص بك هو: ${code}`,
            type: 'key_code',
            courseId,
            keyId: key.id,
            code
          });
        }
      }
    }

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
