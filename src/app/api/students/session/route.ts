import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession, getStudent, getStudentActivations } from '@/lib/firebase-db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = await getSession(token);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const student = await getStudent(session.studentId);
    if (!student) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Get student's active access
    const activations = await getStudentActivations(student.id);
    const activeCourses = activations
      .filter(a => new Date(a.expiresAt) > new Date())
      .map(a => ({
        courseId: a.accessKey?.courseId,
        courseTitle: a.accessKey?.course?.title,
        expiresAt: a.expiresAt
      }));

    return NextResponse.json({
      authenticated: true,
      student: { id: student.id, name: student.name, username: (student as any).username, phone: student.phone, whatsapp: student.whatsapp, stage: student.stage, year: (student as any).year || '', createdAt: student.createdAt },
      activeCourses
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
