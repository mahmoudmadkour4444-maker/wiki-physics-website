import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Use service role key for server-side uploads (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'video'; // 'video', 'image', 'course'
    const folder = (formData.get('folder') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'لا يوجد ملف' }, { status: 400 });
    }

    // Determine bucket based on type
    let bucket = 'videos';
    if (type === 'image' || type === 'course') {
      bucket = 'images';
    }

    // Create unique filename
    const ext = file.name.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg');
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Convert File to ArrayBuffer then to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ error: 'فشل رفع الملف: ' + error.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      filePath: data.path,
      publicUrl: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      bucket,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'فشل رفع الملف: ' + (error.message || 'خطأ غير معروف') }, { status: 500 });
  }
}
