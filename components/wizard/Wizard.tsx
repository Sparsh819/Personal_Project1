'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser, makeSlug } from '@/lib/supabase';
import type { Business, Photo, Review, Service } from '@/lib/types';

export type WizardMode = 'create' | 'edit';
export type WizardInitial = {
  business: Business;
  services: Service[];
  photos: Photo[];
  reviews: Review[];
  token: string;
};

type ServiceDraft = { id?: string; name: string; category: string };
type ReviewDraft = {
  id?: string;
  reviewer_name: string;
  star_rating: number;
  timeframe: string;
  body: string;
};
type PhotoDraft = {
  id?: string;
  storage_path: string;
  public_url: string;
  is_hero: boolean;
  sort_order: number;
};

const DEFAULT_CATEGORIES = [
  'Roof Repair & Installation',
  'Storm & Emergency',
  'Leaks & Weatherproofing',
  'Maintenance',
  'Ventilation',
  'General',
];

const STEPS = [
  { key: 'info', label: 'Business info' },
  { key: 'services', label: 'Services' },
  { key: 'photos', label: 'Photos' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'style', label: 'Style' },
  { key: 'generate', label: 'Generate' },
] as const;

export function Wizard({ mode, initial }: { mode: WizardMode; initial?: WizardInitial }) {
  const [step, setStep] = useState(0);

  // Business info
  const [name, setName] = useState(initial?.business.name ?? '');
  const [tagline, setTagline] = useState(initial?.business.tagline ?? '');
  const [description, setDescription] = useState(initial?.business.description ?? '');
  const [phone, setPhone] = useState(initial?.business.phone ?? '');
  const [address, setAddress] = useState(initial?.business.address ?? '');
  const [mapsUrl, setMapsUrl] = useState(initial?.business.maps_url ?? '');
  const [rating, setRating] = useState(String(initial?.business.google_rating ?? '4.9'));
  const [reviewsCount, setReviewsCount] = useState(String(initial?.business.google_reviews_count ?? '0'));
  const [hours, setHours] = useState(initial?.business.hours ?? 'Open 24 Hours');

  // Services
  const [servicesBlob, setServicesBlob] = useState('');
  const [services, setServices] = useState<ServiceDraft[]>(
    initial?.services.map((s) => ({ id: s.id, name: s.name, category: s.category })) ?? []
  );

  // Photos
  const [photos, setPhotos] = useState<PhotoDraft[]>(
    initial?.photos.map((p) => ({
      id: p.id,
      storage_path: p.storage_path,
      public_url: p.public_url,
      is_hero: p.is_hero,
      sort_order: p.sort_order,
    })) ?? []
  );
  const [uploading, setUploading] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<ReviewDraft[]>(
    initial?.reviews.map((r) => ({
      id: r.id,
      reviewer_name: r.reviewer_name,
      star_rating: r.star_rating,
      timeframe: r.timeframe ?? '',
      body: r.body,
    })) ?? []
  );
  const [reviewBlob, setReviewBlob] = useState('');

  // Style
  const [primary, setPrimary] = useState(initial?.business.primary_color ?? '#E2A23B');
  const [secondary, setSecondary] = useState(initial?.business.secondary_color ?? '#6E93A8');
  const [auroraOn, setAuroraOn] = useState(initial?.business.aurora_enabled ?? true);
  const [screwOn, setScrewOn] = useState(initial?.business.screw_enabled ?? true);

  // Result / errors
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ slug: string; token: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AI enhancement
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  async function enrichBusiness() {
    if (!name) {
      setAiError('Enter a business name first.');
      return;
    }
    setAiBusy(true);
    setAiError(null);
    setAiNote(null);
    try {
      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'enrich_business', name, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      if (!tagline) setTagline(data.tagline);
      setPrimary(data.primaryColor);
      setSecondary(data.secondaryColor);
      setAiNote(`✨ ${data.colorRationale}`);
    } catch (e: any) {
      setAiError(e.message ?? 'AI request failed.');
    } finally {
      setAiBusy(false);
    }
  }

  async function categorizeServices() {
    if (services.length === 0) {
      setAiError('Add some services first.');
      return;
    }
    setAiBusy(true);
    setAiError(null);
    setAiNote(null);
    try {
      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'categorize_services', services: services.map((s) => s.name) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      const byName = new Map<string, string>(
        data.categorized.map((c: { name: string; category: string }) => [c.name.toLowerCase(), c.category])
      );
      setServices(services.map((s) => ({ ...s, category: byName.get(s.name.toLowerCase()) ?? s.category })));
      setAiNote(`✨ Categorized ${data.categorized.length} services.`);
    } catch (e: any) {
      setAiError(e.message ?? 'AI request failed.');
    } finally {
      setAiBusy(false);
    }
  }

  const slug = useMemo(() => {
    if (mode === 'edit' && initial) return initial.business.slug;
    return makeSlug(name, address.split(',')[1]);
  }, [name, address, mode, initial]);

  // --------- Services helpers ---------
  function parseServicesBlob() {
    if (!servicesBlob.trim()) return;
    const parts = servicesBlob
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter(Boolean);
    const next = [...services];
    for (const p of parts) {
      if (!next.some((s) => s.name.toLowerCase() === p.toLowerCase())) {
        next.push({ name: p, category: 'General' });
      }
    }
    setServices(next);
    setServicesBlob('');
  }

  function removeService(i: number) {
    setServices(services.filter((_, idx) => idx !== i));
  }
  function updateService(i: number, patch: Partial<ServiceDraft>) {
    setServices(services.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  // --------- Photo upload ---------
  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const sb = supabaseBrowser();
    const next = [...photos];
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${slug || 'draft'}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await sb.storage.from('business-photos').upload(path, file, {
          upsert: false,
          contentType: file.type,
        });
        if (upErr) throw upErr;
        const { data: pub } = sb.storage.from('business-photos').getPublicUrl(path);
        next.push({
          storage_path: path,
          public_url: pub.publicUrl,
          is_hero: next.length === 0,
          sort_order: next.length,
        });
      }
      setPhotos(next);
    } catch (e: any) {
      setError(e.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }
  function removePhoto(i: number) {
    setPhotos(photos.filter((_, idx) => idx !== i));
  }
  function setHero(i: number) {
    setPhotos(photos.map((p, idx) => ({ ...p, is_hero: idx === i })));
  }

  // --------- Reviews helpers ---------
  function addReview() {
    setReviews([...reviews, { reviewer_name: '', star_rating: 5, timeframe: '', body: '' }]);
  }
  function updateReview(i: number, patch: Partial<ReviewDraft>) {
    setReviews(reviews.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeReview(i: number) {
    setReviews(reviews.filter((_, idx) => idx !== i));
  }
  function parseReviewBlob() {
    if (!reviewBlob.trim()) return;
    // heuristic: first line = "Name" or "Name X reviews", 2nd line has stars/time, rest = body
    const lines = reviewBlob.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const name = lines[0].replace(/\d+\s+reviews?/i, '').trim();
    const timeMatch = lines.slice(1, 3).find((l) => /ago|month|year|week|day/i.test(l));
    const timeframe = timeMatch?.replace(/^★+\s*/, '').replace(/^5\s*stars?/i, '').trim() ?? '';
    const bodyStart = lines.findIndex((l, idx) => idx > 0 && !/ago|month|year|week|day|reviews?|★|reasonable|great price/i.test(l) && l.length > 20);
    const body = bodyStart >= 0 ? lines.slice(bodyStart).join(' ') : lines.slice(1).join(' ');
    setReviews([...reviews, { reviewer_name: name, star_rating: 5, timeframe, body }]);
    setReviewBlob('');
  }

  // --------- Save ---------
  async function save() {
    setSaving(true);
    setError(null);
    const sb = supabaseBrowser();
    try {
      const payload: any = {
        slug,
        name,
        tagline: tagline || null,
        description: description || null,
        phone: phone || null,
        address: address || null,
        maps_url: mapsUrl || null,
        google_rating: rating ? Number(rating) : null,
        google_reviews_count: reviewsCount ? Number(reviewsCount) : null,
        hours: hours || null,
        primary_color: primary,
        secondary_color: secondary,
        aurora_enabled: auroraOn,
        screw_enabled: screwOn,
      };

      let businessId: string;
      let token: string;

      if (mode === 'edit' && initial) {
        // update
        const { data, error: e } = await sb
          .from('businesses')
          .update(payload)
          .eq('id', initial.business.id)
          .select()
          .single();
        if (e) throw e;
        businessId = data.id;
        token = initial.token;
        // wipe and reinsert children (simpler than diffing for MVP)
        await sb.from('services').delete().eq('business_id', businessId);
        await sb.from('reviews').delete().eq('business_id', businessId);
        // photos: keep existing rows that have ids, insert new ones
        const keepIds = photos.filter((p) => p.id).map((p) => p.id!);
        if (keepIds.length > 0) {
          await sb.from('photos').delete().eq('business_id', businessId).not('id', 'in', `(${keepIds.map((i) => `"${i}"`).join(',')})`);
        } else {
          await sb.from('photos').delete().eq('business_id', businessId);
        }
      } else {
        // insert
        const { data, error: e } = await sb.from('businesses').insert(payload).select().single();
        if (e) throw e;
        businessId = data.id;
        token = data.edit_token;
      }

      // Insert services
      if (services.length > 0) {
        const rows = services.map((s, idx) => ({
          business_id: businessId,
          name: s.name,
          category: s.category || 'General',
          sort_order: idx,
        }));
        const { error: se } = await sb.from('services').insert(rows);
        if (se) throw se;
      }

      // Insert reviews
      const cleanReviews = reviews.filter((r) => r.reviewer_name && r.body);
      if (cleanReviews.length > 0) {
        const rows = cleanReviews.map((r, idx) => ({
          business_id: businessId,
          reviewer_name: r.reviewer_name,
          star_rating: r.star_rating,
          timeframe: r.timeframe || null,
          body: r.body,
          sort_order: idx,
        }));
        const { error: re } = await sb.from('reviews').insert(rows);
        if (re) throw re;
      }

      // Insert new photos (ones without id) and update existing
      const newPhotos = photos.filter((p) => !p.id);
      if (newPhotos.length > 0) {
        const rows = newPhotos.map((p) => ({
          business_id: businessId,
          storage_path: p.storage_path,
          public_url: p.public_url,
          is_hero: p.is_hero,
          sort_order: p.sort_order,
        }));
        const { error: pe } = await sb.from('photos').insert(rows);
        if (pe) throw pe;
      }
      // Update existing photos' is_hero / sort_order
      for (const p of photos.filter((p) => p.id)) {
        await sb
          .from('photos')
          .update({ is_hero: p.is_hero, sort_order: p.sort_order })
          .eq('id', p.id!);
      }

      setResult({ slug, token });
    } catch (e: any) {
      setError(e.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  // ==================== RENDER ====================

  if (result) {
    return (
      <div
        className="p-8 rounded-2xl border"
        style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}
      >
        <div className="font-mono text-xs uppercase" style={{ color: '#E2A23B' }}>
          {mode === 'create' ? 'Site generated' : 'Changes saved'}
        </div>
        <h2 className="font-display uppercase text-3xl mt-2">All set.</h2>
        <div className="mt-6 space-y-4">
          <a
            href={`/site/${result.slug}`}
            target="_blank"
            className="block p-4 rounded-xl border font-mono"
            style={{ borderColor: 'var(--line)' }}
          >
            <div className="text-xs uppercase" style={{ color: 'var(--ink-dim)' }}>
              Live site
            </div>
            <div style={{ color: 'var(--ink)' }}>/site/{result.slug} →</div>
          </a>
          <a
            href={`/admin/${result.slug}?token=${result.token}`}
            className="block p-4 rounded-xl border font-mono"
            style={{ borderColor: 'var(--line)' }}
          >
            <div className="text-xs uppercase" style={{ color: 'var(--ink-dim)' }}>
              Admin link (send this to the owner)
            </div>
            <div style={{ color: 'var(--ink)' }}>/admin/{result.slug}?token={result.token} →</div>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {STEPS.map((s, idx) => (
          <button
            key={s.key}
            onClick={() => setStep(idx)}
            className="font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-full border transition"
            style={{
              borderColor: idx === step ? '#E2A23B' : 'var(--line)',
              background: idx === step ? '#E2A23B' : 'transparent',
              color: idx === step ? '#101418' : 'var(--ink-dim)',
            }}
          >
            {idx + 1}. {s.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div
        className="p-8 rounded-2xl border"
        style={{
          borderColor: 'var(--line)',
          background: 'var(--surface)',
          boxShadow: '0 22px 40px -20px rgba(0,0,0,.65)',
        }}
      >
        {step === 0 && (
          <div className="space-y-5">
            <FieldLabel>Business name</FieldLabel>
            <Input value={name} onChange={setName} placeholder="Martin & Sons Roof Repair" />

            <FieldLabel>Tagline</FieldLabel>
            <Input value={tagline} onChange={setTagline} placeholder="Roofing done right, storm after storm." />

            <FieldLabel>Google Business description</FieldLabel>
            <Textarea
              value={description}
              onChange={setDescription}
              rows={4}
              placeholder="Family-owned roofing contractor serving..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Phone</FieldLabel>
                <Input value={phone} onChange={setPhone} placeholder="(469) 460-6242" />
              </div>
              <div>
                <FieldLabel>Hours</FieldLabel>
                <Input value={hours} onChange={setHours} placeholder="Open 24 Hours" />
              </div>
            </div>

            <FieldLabel>Address</FieldLabel>
            <Input value={address} onChange={setAddress} placeholder="9332 Clifford St, Fort Worth, TX 76108" />

            <FieldLabel>Google Maps URL (optional)</FieldLabel>
            <Input value={mapsUrl} onChange={setMapsUrl} placeholder="https://maps.google.com/..." />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Google rating</FieldLabel>
                <Input value={rating} onChange={setRating} placeholder="4.9" />
              </div>
              <div>
                <FieldLabel>Number of reviews</FieldLabel>
                <Input value={reviewsCount} onChange={setReviewsCount} placeholder="111" />
              </div>
            </div>

            <div className="pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
              <button
                onClick={enrichBusiness}
                disabled={aiBusy || !name}
                className="font-mono text-xs uppercase tracking-wider px-4 py-3 rounded-lg border disabled:opacity-40"
                style={{ borderColor: '#E2A23B', color: '#E2A23B' }}
              >
                {aiBusy ? 'Thinking…' : '✨ Suggest tagline + colors with AI'}
              </button>
              <AiStatus note={aiNote} error={aiError} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <FieldLabel>Paste services list (comma or line separated)</FieldLabel>
            <Textarea
              value={servicesBlob}
              onChange={setServicesBlob}
              rows={5}
              placeholder={'Roof Repair, Roof Installation, Storm Damage Repair'}
            />
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={parseServicesBlob}
                className="font-mono text-xs uppercase px-4 py-2 rounded-lg"
                style={{ background: '#E2A23B', color: '#101418' }}
              >
                + Add to list
              </button>
              <button
                onClick={categorizeServices}
                disabled={aiBusy || services.length === 0}
                className="font-mono text-xs uppercase px-4 py-2 rounded-lg border disabled:opacity-40"
                style={{ borderColor: '#E2A23B', color: '#E2A23B' }}
              >
                {aiBusy ? 'Thinking…' : '✨ Auto-categorize with AI'}
              </button>
            </div>
            <AiStatus note={aiNote} error={aiError} />

            <div className="mt-6 space-y-3">
              {services.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{ borderColor: 'var(--line)', background: 'var(--bg-2)' }}
                >
                  <input
                    value={s.name}
                    onChange={(e) => updateService(i, { name: e.target.value })}
                    className="flex-1 bg-transparent outline-none"
                    style={{ color: 'var(--ink)' }}
                  />
                  <select
                    value={s.category}
                    onChange={(e) => updateService(i, { category: e.target.value })}
                    className="bg-transparent border rounded-md px-2 py-1 font-mono text-xs"
                    style={{ borderColor: 'var(--line)', color: 'var(--ink-dim)' }}
                  >
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option key={c} value={c} style={{ background: 'var(--bg-2)' }}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => removeService(i)} className="font-mono text-xs" style={{ color: '#D9634F' }}>
                    ✕
                  </button>
                </div>
              ))}
              {services.length === 0 && (
                <p style={{ color: 'var(--ink-dim)' }} className="text-sm">
                  No services yet. Paste some above.
                </p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <FieldLabel>Upload project photos</FieldLabel>
            <label
              className="block p-8 rounded-xl border-2 border-dashed text-center cursor-pointer"
              style={{ borderColor: 'var(--line)', color: 'var(--ink-dim)' }}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
              {uploading ? 'Uploading…' : 'Click or drop images here'}
            </label>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {photos.map((p, i) => (
                <div
                  key={i}
                  className="relative rounded-xl overflow-hidden border"
                  style={{ borderColor: p.is_hero ? '#E2A23B' : 'var(--line)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.public_url} alt="" className="w-full aspect-[4/3] object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex justify-between p-2" style={{ background: 'rgba(0,0,0,.7)' }}>
                    <button
                      onClick={() => setHero(i)}
                      className="font-mono text-[10px] uppercase"
                      style={{ color: p.is_hero ? '#E2A23B' : 'var(--ink-dim)' }}
                    >
                      {p.is_hero ? '★ Hero' : 'Set hero'}
                    </button>
                    <button onClick={() => removePhoto(i)} className="font-mono text-[10px]" style={{ color: '#D9634F' }}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <FieldLabel>Paste a review block (auto-parse helper)</FieldLabel>
            <Textarea
              value={reviewBlob}
              onChange={setReviewBlob}
              rows={5}
              placeholder={'Izabella B.\n2 reviews\n5★ a month ago\nGreat price\nExcellent roofing service...'}
            />
            <button
              onClick={parseReviewBlob}
              className="font-mono text-xs uppercase px-4 py-2 rounded-lg"
              style={{ background: '#E2A23B', color: '#101418' }}
            >
              + Parse into review
            </button>

            <div className="pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
              <button onClick={addReview} className="font-mono text-xs uppercase" style={{ color: 'var(--ink-dim)' }}>
                + Add blank review
              </button>
            </div>

            <div className="space-y-4 mt-4">
              {reviews.map((r, i) => (
                <div key={i} className="p-4 rounded-xl border" style={{ borderColor: 'var(--line)', background: 'var(--bg-2)' }}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input value={r.reviewer_name} onChange={(v) => updateReview(i, { reviewer_name: v })} placeholder="Reviewer name" />
                    <Input value={r.timeframe} onChange={(v) => updateReview(i, { timeframe: v })} placeholder="3 months ago" />
                    <select
                      value={r.star_rating}
                      onChange={(e) => updateReview(i, { star_rating: Number(e.target.value) })}
                      className="bg-transparent border rounded-lg px-3 py-2 font-mono text-sm"
                      style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n} style={{ background: 'var(--bg-2)' }}>
                          {n} ★
                        </option>
                      ))}
                    </select>
                  </div>
                  <Textarea
                    value={r.body}
                    onChange={(v) => updateReview(i, { body: v })}
                    rows={3}
                    placeholder="Review text..."
                  />
                  <button onClick={() => removeReview(i)} className="font-mono text-xs mt-2" style={{ color: '#D9634F' }}>
                    Remove review
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <FieldLabel>Primary accent</FieldLabel>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    className="w-16 h-12 rounded-lg border cursor-pointer"
                    style={{ borderColor: 'var(--line)' }}
                  />
                  <Input value={primary} onChange={setPrimary} />
                </div>
              </div>
              <div>
                <FieldLabel>Secondary (steel)</FieldLabel>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondary}
                    onChange={(e) => setSecondary(e.target.value)}
                    className="w-16 h-12 rounded-lg border cursor-pointer"
                    style={{ borderColor: 'var(--line)' }}
                  />
                  <Input value={secondary} onChange={setSecondary} />
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer" style={{ borderColor: 'var(--line)' }}>
              <input type="checkbox" checked={auroraOn} onChange={(e) => setAuroraOn(e.target.checked)} />
              <span>Animated aurora background</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer" style={{ borderColor: 'var(--line)' }}>
              <input type="checkbox" checked={screwOn} onChange={(e) => setScrewOn(e.target.checked)} />
              <span>Translucent rotating screw background</span>
            </label>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <div className="font-mono text-xs uppercase" style={{ color: '#E2A23B' }}>
              Ready to {mode === 'create' ? 'generate' : 'save'}
            </div>
            <div className="text-sm space-y-1" style={{ color: 'var(--ink-dim)' }}>
              <div>Business: <span style={{ color: 'var(--ink)' }}>{name || '(missing)'}</span></div>
              <div>Slug: <span style={{ color: 'var(--ink)' }}>{slug || '(auto)'}</span></div>
              <div>{services.length} service(s) · {photos.length} photo(s) · {reviews.length} review(s)</div>
            </div>

            {error && (
              <div className="p-4 rounded-xl border" style={{ borderColor: '#D9634F', color: '#D9634F' }}>
                {error}
              </div>
            )}

            <button
              disabled={saving || !name}
              onClick={save}
              className="font-mono text-sm uppercase tracking-wider px-6 py-4 rounded-xl w-full disabled:opacity-50"
              style={{ background: '#E2A23B', color: '#101418' }}
            >
              {saving ? 'Saving…' : mode === 'create' ? '⚡ Generate site' : '💾 Save changes'}
            </button>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="font-mono text-xs uppercase px-5 py-3 rounded-lg border disabled:opacity-30"
          style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
        >
          ← Back
        </button>
        {step < STEPS.length - 1 && (
          <button
            onClick={() => setStep(step + 1)}
            className="font-mono text-xs uppercase px-5 py-3 rounded-lg"
            style={{ background: '#E2A23B', color: '#101418' }}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- shared field bits ----------
function AiStatus({ note, error }: { note: string | null; error: string | null }) {
  if (!note && !error) return null;
  return (
    <div
      className="mt-3 p-3 rounded-lg text-sm"
      style={{
        background: error ? 'rgba(217,99,79,.1)' : 'rgba(226,162,59,.1)',
        color: error ? '#D9634F' : '#E2A23B',
      }}
    >
      {error ?? note}
    </div>
  );
}
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-mono text-[11px] uppercase tracking-widest mb-2" style={{ color: 'var(--ink-dim)' }}>
      {children}
    </label>
  );
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent border rounded-lg px-4 py-3 outline-none focus:border-amber-400"
      style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
    />
  );
}
function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-transparent border rounded-lg px-4 py-3 outline-none focus:border-amber-400 resize-none"
      style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
    />
  );
}
