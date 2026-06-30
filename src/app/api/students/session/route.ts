import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = await db.session.findUnique({
      where: { token },
      include: { student: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Get student's active access
    const activations = await db.keyActivation.findMany({
      where: { studentId: session.studentId, expiresAt: { gt: new Date() } },
      include: { accessKey: { include: { course: true } } }
    });

    const activeCourses = activations.map(a => ({
      courseId: a.accessKey.courseId,
      courseTitle: a.accessKey.course?.title,
      expiresAt: a.expiresAt
    }));

    return NextResponse.json({ 
      authenticated: true, 
      student: session.student,
      activeCourses
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
