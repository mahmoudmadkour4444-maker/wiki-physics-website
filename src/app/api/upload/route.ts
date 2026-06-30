import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم رفع ملف' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(file.name) || '.mp4';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    await writeFile(filePath, buffer);

    // Save to database
    const upload = await db.videoUpload.create({
      data: {
        fileName: file.name,
        filePath: `/uploads/${fileName}`,
        fileSize: file.size,
        mimeType: file.type || 'video/mp4'
      }
    });

    return NextResponse.json({ 
      success: true, 
      filePath: `/uploads/${fileName}`,
      upload
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الرفع' }, { status: 500 });
  }
}
