import { supabaseServer } from './supabase';
import type { BusinessBundle } from './types';

export async function loadBusinessBundle(slug: string): Promise<BusinessBundle | null> {
  const sb = supabaseServer();
  const { data: business } = await sb.from('businesses').select('*').eq('slug', slug).maybeSingle();
  if (!business) return null;

  const [{ data: services = [] }, { data: photos = [] }, { data: reviews = [] }] = await Promise.all([
    sb.from('services').select('*').eq('business_id', business.id).order('sort_order'),
    sb.from('photos').select('*').eq('business_id', business.id).order('sort_order'),
    sb.from('reviews').select('*').eq('business_id', business.id).order('sort_order'),
  ]);

  return {
    business,
    services: services ?? [],
    photos: photos ?? [],
    reviews: reviews ?? [],
  };
}
