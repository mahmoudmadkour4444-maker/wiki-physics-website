import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId');

    const where = courseId ? { courseId } : {};
    const lessons = await db.lesson.findMany({
      where,
      include: { course: { select: { title: true } } },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Lessons GET error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, videoType, videoUrl, filePath, courseId, order, duration } = body;

    if (!title || !courseId) {
      return NextResponse.json({ error: 'اسم الدرس والكورس مطلوبان' }, { status: 400 });
    }

    const lesson = await db.lesson.create({
      data: {
        title,
        description: description || null,
        videoType: videoType || 'youtube',
        videoUrl: videoUrl || null,
        filePath: filePath || null,
        courseId,
        order: order || 0,
        duration: duration || null
      }
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Lesson POST error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
