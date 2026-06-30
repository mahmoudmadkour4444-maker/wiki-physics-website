import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { botToken, chatId, message } = body;

    if (!botToken || !chatId || !message) {
      return NextResponse.json({ error: 'بيانات التليجرام غير مكتملة' }, { status: 400 });
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' })
    });

    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json({ error: 'فشل إرسال الرسالة', details: data }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram send error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
