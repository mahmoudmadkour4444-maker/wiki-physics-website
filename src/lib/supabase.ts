import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage bucket names
export const BUCKETS = {
  VIDEOS: 'videos',
  IMAGES: 'images',
  COURSES: 'courses',
} as const;

// Helper to get public URL for a file
export function getPublicUrl(bucket: string, filePath: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

// Upload file to Supabase Storage
export async function uploadToSupabase(
  bucket: string,
  file: File,
  folder: string = ''
): Promise<{ path: string; publicUrl: string } | null> {
  try {
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return null;
    }

    const publicUrl = getPublicUrl(bucket, data.path);
    return { path: data.path, publicUrl };
  } catch (err) {
    console.error('Upload exception:', err);
    return null;
  }
}

// Upload file from buffer (server-side)
export async function uploadBufferToSupabase(
  bucket: string,
  buffer: Buffer,
  originalName: string,
  contentType: string,
  folder: string = ''
): Promise<{ path: string; publicUrl: string } | null> {
  try {
    const ext = originalName.split('.').pop() || 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return null;
    }

    const publicUrl = getPublicUrl(bucket, data.path);
    return { path: data.path, publicUrl };
  } catch (err) {
    console.error('Upload exception:', err);
    return null;
  }
}
