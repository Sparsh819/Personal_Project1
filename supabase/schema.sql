-- ================================================================
-- RoofSite Studio — Supabase schema
-- Paste this entire file into Supabase → SQL Editor → New Query → Run
-- ================================================================

-- 1. Tables
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text,
  description text,
  phone text,
  address text,
  maps_url text,
  google_rating numeric(2,1),
  google_reviews_count int,
  hours text,
  primary_color text default '#E2A23B',
  secondary_color text default '#6E93A8',
  aurora_enabled boolean default true,
  screw_enabled boolean default true,
  hero_photo_id uuid,
  owner_user_id uuid references auth.users(id) on delete set null,
  edit_token text unique default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  category text default 'General',
  sort_order int default 0
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  sort_order int default 0,
  is_hero boolean default false
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  reviewer_name text not null,
  star_rating int default 5 check (star_rating between 1 and 5),
  timeframe text,
  body text not null,
  sort_order int default 0
);

create index if not exists idx_services_biz on public.services(business_id);
create index if not exists idx_photos_biz on public.photos(business_id);
create index if not exists idx_reviews_biz on public.reviews(business_id);

-- 2. Storage bucket (must ALSO be created via UI Step A5; this only sets policies)
insert into storage.buckets (id, name, public)
values ('business-photos', 'business-photos', true)
on conflict (id) do nothing;

-- 3. Row Level Security
alter table public.businesses enable row level security;
alter table public.services   enable row level security;
alter table public.photos     enable row level security;
alter table public.reviews    enable row level security;

-- Anyone can read (site is public)
drop policy if exists "public read businesses" on public.businesses;
create policy "public read businesses" on public.businesses for select using (true);

drop policy if exists "public read services" on public.services;
create policy "public read services" on public.services for select using (true);

drop policy if exists "public read photos" on public.photos;
create policy "public read photos" on public.photos for select using (true);

drop policy if exists "public read reviews" on public.reviews;
create policy "public read reviews" on public.reviews for select using (true);

-- Anyone can INSERT a new business (and become its owner via the app)
drop policy if exists "anyone insert businesses" on public.businesses;
create policy "anyone insert businesses" on public.businesses for insert with check (true);

drop policy if exists "anyone insert services" on public.services;
create policy "anyone insert services" on public.services for insert with check (true);

drop policy if exists "anyone insert photos" on public.photos;
create policy "anyone insert photos" on public.photos for insert with check (true);

drop policy if exists "anyone insert reviews" on public.reviews;
create policy "anyone insert reviews" on public.reviews for insert with check (true);

-- Anyone can update/delete rows they know the edit_token for (checked in app)
-- Owners can also update once they've claimed the business (auth path, future)
drop policy if exists "anyone update businesses" on public.businesses;
create policy "anyone update businesses" on public.businesses for update using (true) with check (true);

drop policy if exists "anyone update services" on public.services;
create policy "anyone update services" on public.services for update using (true) with check (true);
drop policy if exists "anyone delete services" on public.services;
create policy "anyone delete services" on public.services for delete using (true);

drop policy if exists "anyone update photos" on public.photos;
create policy "anyone update photos" on public.photos for update using (true) with check (true);
drop policy if exists "anyone delete photos" on public.photos;
create policy "anyone delete photos" on public.photos for delete using (true);

drop policy if exists "anyone update reviews" on public.reviews;
create policy "anyone update reviews" on public.reviews for update using (true) with check (true);
drop policy if exists "anyone delete reviews" on public.reviews;
create policy "anyone delete reviews" on public.reviews for delete using (true);

-- Storage: public read + public upload (fine for demo; tighten later)
drop policy if exists "public read business photos" on storage.objects;
create policy "public read business photos" on storage.objects for select using (bucket_id = 'business-photos');

drop policy if exists "public upload business photos" on storage.objects;
create policy "public upload business photos" on storage.objects for insert with check (bucket_id = 'business-photos');

drop policy if exists "public delete business photos" on storage.objects;
create policy "public delete business photos" on storage.objects for delete using (bucket_id = 'business-photos');

-- 4. Seed demo business (Martin & Sons)
insert into public.businesses (
  slug, name, tagline, description, phone, address,
  google_rating, google_reviews_count, hours,
  primary_color, secondary_color
) values (
  'martin-sons-roof-repair-fort-worth',
  'Martin & Sons Roof Repair',
  'Roofing done right, storm after storm.',
  'Family-owned roofing contractor serving Fort Worth, TX with 4.9★ across 111 Google reviews. Full-service roof repair and replacement.',
  '(469) 460-6242',
  '9332 Clifford St, Fort Worth, TX 76108',
  4.9, 111, 'Open 24 Hours',
  '#E2A23B', '#6E93A8'
) on conflict (slug) do nothing;

-- Seed services for the demo business
do $$
declare biz_id uuid;
begin
  select id into biz_id from public.businesses where slug = 'martin-sons-roof-repair-fort-worth';
  if biz_id is not null then
    delete from public.services where business_id = biz_id;
    insert into public.services (business_id, name, category, sort_order) values
      (biz_id, 'Roof Repair', 'Roof Repair & Installation', 1),
      (biz_id, 'Roof Installation', 'Roof Repair & Installation', 2),
      (biz_id, 'Full Roof Replacement', 'Roof Repair & Installation', 3),
      (biz_id, 'Shingle Replacement', 'Roof Repair & Installation', 4),
      (biz_id, 'Tile Replacement', 'Roof Repair & Installation', 5),
      (biz_id, 'Emergency Hail Damage Repair', 'Storm & Emergency', 6),
      (biz_id, 'Storm Damage Repair', 'Storm & Emergency', 7),
      (biz_id, 'Ice Dam Removal', 'Storm & Emergency', 8),
      (biz_id, 'Animal Damage Repair', 'Storm & Emergency', 9),
      (biz_id, 'Leak Detection And Repair', 'Leaks & Weatherproofing', 10),
      (biz_id, 'Roof Waterproofing', 'Leaks & Weatherproofing', 11),
      (biz_id, 'Flashing Repair', 'Leaks & Weatherproofing', 12),
      (biz_id, 'Chimney Sealing', 'Leaks & Weatherproofing', 13),
      (biz_id, 'Roof Inspection', 'Maintenance', 14),
      (biz_id, 'Roof Cleaning', 'Maintenance', 15),
      (biz_id, 'Moss And Algae Cleaning', 'Maintenance', 16),
      (biz_id, 'Gutter Cleaning', 'Maintenance', 17),
      (biz_id, 'Loft Ventilation', 'Ventilation', 18),
      (biz_id, 'Attic Venting Installation', 'Ventilation', 19),
      (biz_id, 'Thermal Insulation', 'Ventilation', 20);

    delete from public.reviews where business_id = biz_id;
    insert into public.reviews (business_id, reviewer_name, star_rating, timeframe, body, sort_order) values
      (biz_id, 'Izabella B.', 5, 'a month ago',
        'Excellent roofing service. Derek came out the same day we called about a roof leak. After checking the roof, he clearly explained the poor overall condition of the shingles, soffit, and fascia, and showed us the problem areas in detail. Within minutes, Derek gave us a clear written estimate with no sales pressure at all. The crew finished our new roof right on schedule, and the workmanship looks great.', 1),
      (biz_id, 'Kurt Ramos', 5, '3 months ago',
        'As an older homeowner, I noticed some problems with my roof and gutters. Roger was very professional and really knew his stuff. The crew finished the roof in just one day, and the gutters were installed in half a day. They also worked directly with my insurance so everything was stress-free.', 2),
      (biz_id, 'Lawrence Parks', 5, '4 months ago',
        'From the beginning to the end, our experience with this roofing company was outstanding! Roger, our estimator, arrived right on time and explained all our roofing options clearly. We needed a new roof due to hail damage, and he made working with our insurance a breeze. The crew finished ahead of schedule with thorough cleanup.', 3),
      (biz_id, 'K Pratt', 5, '6 months ago',
        'We hired Martin & Sons Roof Repair to fix a leak on our commercial flat roof in Fort Worth. The crew put in a brand new tapered roofing system, which solved our water pooling problem. Derek handled the project, was upfront, and kept us updated. Done at the price we agreed on.', 4),
      (biz_id, 'Hector Page', 5, '6 months ago',
        'I give Martin & Sons roof repair 10 stars out of 5! My whole experience getting my roof replaced was easy, professional, and stress-free. Derek and Roger were always helpful. They used top-notch materials and finished everything right on schedule.', 5);
  end if;
end $$;
