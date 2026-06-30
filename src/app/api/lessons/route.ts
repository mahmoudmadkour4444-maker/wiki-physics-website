import { NextResponse } from 'next/server';
import { getAllLessons, getCourseLessons, createLesson } from '@/lib/firebase-db';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId');

    const lessons = courseId ? await getCourseLessons(courseId) : await getAllLessons();
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

    const lesson = await createLesson({
      title,
      description: description || undefined,
      videoType: videoType || 'youtube',
      videoUrl: videoUrl || undefined,
      filePath: filePath || undefined,
      courseId,
      order: order || 0,
      duration: duration || undefined
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Lesson POST error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
