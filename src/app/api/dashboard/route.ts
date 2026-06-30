import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [courses, students, keys, requests, lessons] = await Promise.all([
      db.course.count(),
      db.student.count(),
      db.accessKey.count(),
      db.accessRequest.count({ where: { status: 'pending' } }),
      db.lesson.count()
    ]);

    const activeKeys = await db.keyActivation.count({
      where: { expiresAt: { gt: new Date() } }
    });

    const recentRequests = await db.accessRequest.findMany({
      take: 10,
      include: { student: true, course: { select: { title: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const recentStudents = await db.student.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      stats: { courses, students, keys, requests, lessons, activeKeys },
      recentRequests,
      recentStudents
    });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
