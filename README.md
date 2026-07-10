# RoofSite Studio

A generator + admin platform for local service-business websites (roofing contractors first).

- **Generator** at `/generate` — 6-step wizard, spits out a public URL and admin link.
- **Public site** at `/site/[slug]` — animated aurora background, translucent rotating screw, service cards, gallery lightbox, review slideshow, Google Maps embed.
- **Admin panel** at `/admin/[slug]?token=XYZ` — same wizard, prefilled, saves back to Supabase.

Stack: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · Supabase (Postgres + Storage).

---

## Setup — do these in order

### 1. Supabase project

1. Go to **https://supabase.com** → **New project**.
2. Wait until it's ready.
3. **Settings → API**, copy the **Project URL** and the **anon public key** into a notepad.
4. **SQL Editor → New query**, paste the entire contents of `supabase/schema.sql`, click **Run**. You should see "Success. No rows returned."
5. **Storage → New bucket**, name it exactly `business-photos`, toggle **Public bucket** ON, click **Create bucket**.

### 2. Local install

```bash
cd roofsite-studio
npm install
cp .env.local.example .env.local
```

Open `.env.local` and paste in:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

Then:
```bash
npm run dev
```

Open **http://localhost:3000**. You should see the operator dashboard listing "Martin & Sons Roof Repair" (the seed row). Click **Edit** to try the admin flow, click **View** to see the public site.

### 3. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Go to **https://vercel.com/new**, import the repo.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**.

Done. Your live URL will be `something.vercel.app`.

---

## How selling works

For each vendor:
1. Go to `/generate`, fill in their info, upload their photos, paste their reviews, hit Generate.
2. Get two links from the success screen: a **live site** URL and an **admin** URL with the edit token.
3. Sell them the live URL. Give the admin URL to their office manager so they can update photos/reviews later. That admin link is the "control panel" — no login required, just don't share the URL.

You (the operator) can see and edit every site from the homepage dashboard.

---

## Security notes (be honest with buyers)

- Admin access is gated by a **secret URL** (edit_token), not a login. Anyone with the URL can edit. This is fine for the MVP — treat the URL like a shared password. If a client wants proper auth, upgrade later with Supabase Auth.
- The Supabase RLS policies in `schema.sql` currently allow anyone to write to the tables (because there's no auth yet). If you deploy publicly, spam is possible. For a controlled rollout (you're the only one generating sites), this is fine. For a real launch, add authenticated inserts.

---

## File layout

```
app/
  page.tsx               → operator dashboard
  generate/page.tsx      → wizard entry (create mode)
  site/[slug]/page.tsx   → public renderer
  admin/[slug]/page.tsx  → admin (edit mode wizard)
components/
  wizard/Wizard.tsx      → 6-step wizard (used by both create and edit)
  site/PublicSite.tsx    → the full site renderer with aurora + screw
lib/
  supabase.ts            → clients + slug helper
  loaders.ts             → server-side bundle loader
  types.ts               → all TS types
supabase/
  schema.sql             → run this in Supabase SQL Editor
```
