import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const courses = await db.course.findMany({
      include: { 
        lessons: { orderBy: { order: 'asc' } },
        _count: { select: { lessons: true, keys: true, requests: true } }
      },
      orderBy: { order: 'asc' }
    });
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Courses GET error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, image, price, order } = body;

    if (!title) {
      return NextResponse.json({ error: 'اسم الكورس مطلوب' }, { status: 400 });
    }

    const course = await db.course.create({
      data: {
        title,
        description: description || '',
        image: image || null,
        price: price || 'مجاني',
        order: order || 0
      }
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error('Course POST error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
