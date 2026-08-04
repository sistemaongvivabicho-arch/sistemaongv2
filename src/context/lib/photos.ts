import { supabase } from './supabase';

export const PHOTOS_BUCKET = 'animal-photos';

export function getPublicPhotoUrl(path: string): string {
  if (!path) return '';
  const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
