import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const requests = await db.accessRequest.findMany({
      include: {
        student: true,
        course: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Requests GET error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, courseId, code, whatsapp, message } = body;

    if (!studentId || !courseId || !whatsapp) {
      return NextResponse.json({ error: 'جميع البيانات مطلوبة' }, { status: 400 });
    }

    const request = await db.accessRequest.create({
      data: {
        studentId,
        courseId,
        code: code || null,
        whatsapp,
        message: message || null,
        status: 'pending'
      },
      include: {
        student: true,
        course: true
      }
    });

    // Send Telegram notification
    try {
      const settings = await db.setting.findMany();
      const botToken = settings.find(s => s.key === 'telegram_bot_token')?.value;
      const chatId = settings.find(s => s.key === 'telegram_chat_id')?.value;

      if (botToken && chatId) {
        const text = `🔔 *طلب اشتراك جديد*\n\n` +
          `👤 *الاسم:* ${request.student.name}\n` +
          `📱 *الهاتف:* ${request.student.phone}\n` +
          `💬 *واتساب:* ${request.whatsapp}\n` +
          `📚 *المرحلة:* ${request.student.stage}\n` +
          `📅 *السنة:* ${request.student.year}\n` +
          `📖 *الكورس:* ${request.course.title}\n` +
          `🔑 *الكود:* ${request.code || 'لم يُدخل'}\n` +
          `📝 *ملاحظات:* ${request.message || 'لا يوجد'}\n` +
          `🕐 *التاريخ:* ${new Date(request.createdAt).toLocaleString('ar-EG')}`;

        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Telegram notification error:', e);
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error('Request POST error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
