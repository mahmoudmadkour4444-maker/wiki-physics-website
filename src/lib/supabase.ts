import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Lazy-initialized Supabase client (avoids build-time initialization errors)
let _supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _supabase;
}

// Storage bucket names
export const BUCKETS = {
  VIDEOS: 'videos',
  IMAGES: 'images',
  COURSES: 'courses',
} as const;

// Helper to get public URL for a file
export function getPublicUrl(bucket: string, filePath: string): string {
  const client = getSupabaseClient();
  const { data } = client.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
