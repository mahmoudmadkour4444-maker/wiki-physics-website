import { NextResponse } from 'next/server';
import { getRequests, createRequest, getStudent, getCourse } from '@/lib/firebase-db';

export async function GET() {
  try {
    const requests = await getRequests();
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

    const request = await createRequest({
      studentId,
      courseId,
      code: code || undefined,
      whatsapp,
      message: message || undefined
    });

    // Send Telegram notification
    try {
      const { getSettings } = await import('@/lib/firebase-db');
      const settingsRaw = await getSettings();
      const settings: Record<string, string> = {};
      if (settingsRaw) {
        for (const [, v] of Object.entries(settingsRaw as Record<string, any>)) {
          if (v && v.value) settings[v.key || ''] = v.value;
        }
      }
      
      const botToken = settings.telegram_bot_token;
      const chatId = settings.telegram_chat_id;

      if (botToken && chatId) {
        const student = await getStudent(studentId);
        const course = await getCourse(courseId);
        
        const text = `🔔 *طلب اشتراك جديد*\n\n` +
          `👤 *الاسم:* ${student?.name || '—'}\n` +
          `📱 *الهاتف:* ${student?.phone || '—'}\n` +
          `💬 *واتساب:* ${whatsapp}\n` +
          `📚 *المرحلة:* ${student?.stage || '—'}\n` +
          `📅 *السنة:* ${(student as any)?.year || '—'}\n` +
          `📖 *الكورس:* ${course?.title || '—'}\n` +
          `🔑 *الكود:* ${code || 'لم يُدخل'}\n` +
          `📝 *ملاحظات:* ${message || 'لا يوجد'}\n` +
          `🕐 *التاريخ:* ${new Date().toLocaleString('ar-EG')}`;

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
