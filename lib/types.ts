export type Business = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  phone: string | null;
  address: string | null;
  maps_url: string | null;
  google_rating: number | null;
  google_reviews_count: number | null;
  hours: string | null;
  primary_color: string;
  secondary_color: string;
  aurora_enabled: boolean;
  screw_enabled: boolean;
  hero_photo_id: string | null;
  owner_user_id: string | null;
  edit_token: string;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  business_id: string;
  name: string;
  category: string;
  sort_order: number;
};

export type Photo = {
  id: string;
  business_id: string;
  storage_path: string;
  public_url: string;
  sort_order: number;
  is_hero: boolean;
};

export type Review = {
  id: string;
  business_id: string;
  reviewer_name: string;
  star_rating: number;
  timeframe: string | null;
  body: string;
  sort_order: number;
};

export type BusinessBundle = {
  business: Business;
  services: Service[];
  photos: Photo[];
  reviews: Review[];
};
