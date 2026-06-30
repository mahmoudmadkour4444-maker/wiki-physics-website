import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/firebase-db';

export async function GET() {
  try {
    const rawSettings = await getSettings();
    // Flatten settings from {key: {value: "..."}} to {key: "..."}
    const flat: Record<string, string> = {};
    if (rawSettings) {
      for (const [k, v] of Object.entries(rawSettings as Record<string, any>)) {
        flat[k] = v?.value || v || '';
      }
    }
    return NextResponse.json(flat);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await saveSettings(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
