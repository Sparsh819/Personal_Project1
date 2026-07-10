'use client';

import { useEffect, useRef, useState } from 'react';
import type { BusinessBundle } from '@/lib/types';

export function PublicSite({ bundle }: { bundle: BusinessBundle }) {
  const { business, services, photos, reviews } = bundle;
  const [reviewIdx, setReviewIdx] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const screwRef = useRef<SVGSVGElement>(null);

  const heroPhoto = photos.find((p) => p.is_hero) ?? photos[0];
  const primary = business.primary_color || '#E2A23B';
  const secondary = business.secondary_color || '#6E93A8';

  // Group services by category
  const grouped = services.reduce<Record<string, typeof services>>((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});
  const categories = Object.keys(grouped);

  const phoneHref = (business.phone ?? '').replace(/[^\d+]/g, '');
  const directionsUrl = business.maps_url
    ? business.maps_url
    : business.address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.address)}`
    : '#';
  const mapsEmbedUrl = business.address
    ? `https://www.google.com/maps?q=${encodeURIComponent(business.address)}&output=embed`
    : '';

  // ---- Screw scroll rotation ----
  useEffect(() => {
    if (!business.screw_enabled) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const onScroll = () => {
      const el = document.documentElement;
      const frac = el.scrollTop / (el.scrollHeight - el.clientHeight || 1);
      const deg = frac * 1440;
      if (screwRef.current) {
        screwRef.current.style.transform = `translate(-50%,-50%) rotate(${deg}deg)`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [business.screw_enabled]);

  // ---- Aurora background canvas ----
  useEffect(() => {
    if (!business.aurora_enabled) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = bgRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0, t = 0, raf = 0;
    const rgbPrimary = hexToRgb(primary);
    const rgbSecondary = hexToRgb(secondary);
    const size = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    size();
    window.addEventListener('resize', size);
    const blobs = [
      { rgb: rgbSecondary, r: 0.55, x: 0.2, y: 0.25, sx: 0.00016, sy: 0.00011, ph: 0 },
      { rgb: rgbPrimary, r: 0.42, x: 0.8, y: 0.3, sx: 0.00013, sy: 0.00017, ph: 2 },
      { rgb: rgbSecondary, r: 0.6, x: 0.55, y: 0.75, sx: 0.00011, sy: 0.00014, ph: 4 },
      { rgb: rgbPrimary, r: 0.3, x: 0.15, y: 0.85, sx: 0.00018, sy: 0.0001, ph: 6 },
    ];
    const sparks = Array.from({ length: 70 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0006 - 0.0004,
      vy: (Math.random() - 0.5) * 0.0003,
      s: Math.random() * 1.6 + 0.4,
      tw: Math.random() * Math.PI * 2,
    }));
    const draw = () => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0f1317');
      g.addColorStop(0.5, '#131920');
      g.addColorStop(1, '#0e1216');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const b of blobs) {
        const bx = (b.x + Math.sin(t * b.sx * 60 + b.ph) * 0.12) * w;
        const by = (b.y + Math.cos(t * b.sy * 60 + b.ph) * 0.1) * h;
        const rad = b.r * Math.min(w, h);
        const rg = ctx.createRadialGradient(bx, by, 0, bx, by, rad);
        const c = b.rgb;
        rg.addColorStop(0, `rgba(${c.r},${c.g},${c.b},0.16)`);
        rg.addColorStop(0.5, `rgba(${c.r},${c.g},${c.b},0.05)`);
        rg.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(bx, by, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const p of sparks) {
        p.x += p.vx;
        p.y += p.vy;
        p.tw += 0.04;
        if (p.x < -0.02) p.x = 1.02;
        if (p.x > 1.02) p.x = -0.02;
        if (p.y < -0.02) p.y = 1.02;
        if (p.y > 1.02) p.y = -0.02;
        const a = 0.25 + Math.sin(p.tw) * 0.2;
        ctx.fillStyle = `rgba(226,182,110,${Math.max(0, a)})`;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      t += 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
    };
  }, [business.aurora_enabled, primary, secondary]);

  return (
    <main className="min-h-screen">
      {business.aurora_enabled && (
        <canvas
          ref={bgRef}
          aria-hidden
          style={{ position: 'fixed', inset: 0, zIndex: -2, width: '100%', height: '100%' }}
        />
      )}

      {business.screw_enabled && (
        <svg
          ref={screwRef}
          viewBox="0 0 200 200"
          aria-hidden
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            zIndex: -1,
            pointerEvents: 'none',
            width: 'min(70vw, 780px)',
            height: 'min(70vw, 780px)',
            transform: 'translate(-50%,-50%)',
            opacity: 0.055,
          }}
        >
          <defs>
            <radialGradient id="sgrad" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#c9d3d8" />
              <stop offset="45%" stopColor="#8b98a1" />
              <stop offset="80%" stopColor="#525d64" />
              <stop offset="100%" stopColor="#333b40" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="94" fill="none" stroke="rgba(0,0,0,.4)" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="88" fill="url(#sgrad)" />
          <rect x="88" y="16" width="24" height="168" rx="4" fill="#000" />
        </svg>
      )}

      {/* Topbar */}
      <div
        className="text-center py-2 font-mono text-xs"
        style={{ background: shade(secondary, -20), color: '#fff' }}
      >
        {business.google_rating ?? '—'}★ on Google ({business.google_reviews_count ?? 0} reviews) ·{' '}
        {business.address?.split(',').slice(-2, -1).join(',').trim() || 'Location'} ·{' '}
        <strong style={{ color: primary }}>{business.hours ?? 'Open now'}</strong>
        {business.phone && (
          <>
            {' · '}
            <a href={`tel:+${phoneHref}`} className="underline">
              {business.phone}
            </a>
          </>
        )}
      </div>

      {/* Nav */}
      <header
        className="sticky top-0 z-50 backdrop-blur border-b"
        style={{ borderColor: 'var(--line)', background: 'rgba(21,25,29,.9)' }}
      >
        <nav className="wrap flex items-center justify-between h-20">
          <a href="#top" className="font-display font-extrabold text-xl uppercase whitespace-nowrap">
            {shortName(business.name)}
          </a>
          <ul className="hidden lg:flex gap-8 font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--ink-dim)' }}>
            <li><a href="#services">Services</a></li>
            <li><a href="#gallery">Our Work</a></li>
            <li><a href="#reviews">Reviews</a></li>
            <li><a href="#contact">Location</a></li>
          </ul>
          <div className="flex items-center gap-4">
            {business.google_rating != null && (
              <span
                className="hidden lg:flex items-center gap-1 font-mono text-sm px-3 py-1 rounded-full border"
                style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}
              >
                <span style={{ color: primary }}>★★★★★</span> {business.google_rating} ({business.google_reviews_count})
              </span>
            )}
            {business.phone && (
              <div className="font-mono">
                <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--ink-dim)' }}>
                  Call now
                </div>
                <a href={`tel:+${phoneHref}`} className="font-semibold">
                  {business.phone}
                </a>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section id="top" className="py-24">
        <div className="wrap grid grid-cols-1 lg:grid-cols-[1.1fr_.9fr] gap-12 items-center">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: primary }}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: primary }} />
              {business.address?.split(',').slice(-2).join(', ').trim() || 'Local roofing contractor'} · {business.hours ?? ''}
            </div>
            <h1 className="font-display font-extrabold uppercase text-5xl md:text-6xl leading-none mb-6">
              {business.tagline ?? business.name}
            </h1>
            {business.description && (
              <p className="max-w-xl mb-8" style={{ color: 'var(--ink-dim)' }}>
                {business.description}
              </p>
            )}
            <div className="flex gap-4 flex-wrap mb-10">
              {business.phone && (
                <a
                  href={`tel:+${phoneHref}`}
                  className="font-mono text-sm uppercase tracking-wider px-6 py-4 rounded-xl"
                  style={{ background: primary, color: '#101418' }}
                >
                  📞 Call {business.phone}
                </a>
              )}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener"
                className="font-mono text-sm uppercase tracking-wider px-6 py-4 rounded-xl border"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                Get Directions
              </a>
            </div>
            <div className="flex gap-8 flex-wrap font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--ink-dim)' }}>
              {business.google_rating != null && (
                <div>
                  <strong className="block font-display text-2xl" style={{ color: 'var(--ink)' }}>
                    {business.google_rating}★
                  </strong>
                  Google Rating
                </div>
              )}
              {business.google_reviews_count != null && (
                <div>
                  <strong className="block font-display text-2xl" style={{ color: 'var(--ink)' }}>
                    {business.google_reviews_count}
                  </strong>
                  Verified Reviews
                </div>
              )}
              <div>
                <strong className="block font-display text-2xl" style={{ color: 'var(--ink)' }}>
                  {services.length}
                </strong>
                Services
              </div>
              <div>
                <strong className="block font-display text-2xl" style={{ color: 'var(--ink)' }}>
                  {business.hours?.match(/24/) ? '24/7' : 'Open'}
                </strong>
                Availability
              </div>
            </div>
          </div>
          {heroPhoto && (
            <div
              className="rounded-2xl overflow-hidden relative border"
              style={{
                borderColor: 'var(--line)',
                boxShadow: '0 22px 40px -20px rgba(0,0,0,.65)',
                transform: 'translateY(-2px)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroPhoto.public_url}
                alt=""
                className="w-full aspect-[4/5] object-cover"
              />
              <div
                className="absolute bottom-4 left-4 font-mono text-[11px] uppercase tracking-wider px-3 py-2 rounded-lg backdrop-blur"
                style={{ background: 'rgba(16,20,24,.72)' }}
              >
                Recent install · {business.address?.split(',').slice(-2).join(',').trim()}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Services */}
      {categories.length > 0 && (
        <section id="services" className="py-24">
          <div className="wrap">
            <div className="mb-12">
              <div className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: primary }}>
                Full Service List
              </div>
              <h2 className="font-display font-extrabold uppercase text-4xl md:text-5xl leading-none">
                Everything under one roof
              </h2>
            </div>
            {categories.map((cat) => (
              <div key={cat} className="mb-10">
                <h3 className="font-mono text-xs uppercase tracking-widest mb-4 font-semibold" style={{ color: secondary }}>
                  {cat}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {grouped[cat].map((s) => (
                    <div
                      key={s.id}
                      className="px-5 py-4 rounded-2xl border transition-all hover:-translate-y-1"
                      style={{
                        borderColor: 'var(--line)',
                        background: 'var(--surface)',
                        boxShadow: '0 22px 40px -20px rgba(0,0,0,.65)',
                      }}
                    >
                      {s.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gallery */}
      {photos.length > 0 && (
        <section
          id="gallery"
          className="py-24 border-y"
          style={{ borderColor: 'var(--line)', background: 'rgba(29,34,39,.72)', backdropFilter: 'blur(2px)' }}
        >
          <div className="wrap">
            <div className="mb-12">
              <div className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: primary }}>
                Recent Work
              </div>
              <h2 className="font-display uppercase text-4xl md:text-5xl">Photos from the field</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setLightbox(p.public_url)}
                  className="rounded-2xl overflow-hidden border relative group aspect-[4/3]"
                  style={{ borderColor: 'var(--line)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.public_url}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews slideshow */}
      {reviews.length > 0 && (
        <section id="reviews" className="py-24">
          <div className="wrap">
            <div className="mb-8">
              <div className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: primary }}>
                What Homeowners Say
              </div>
              <h2 className="font-display uppercase text-4xl md:text-5xl">
                {business.google_rating ?? ''}★ across {business.google_reviews_count ?? reviews.length} reviews
              </h2>
            </div>
            <div className="flex items-center gap-5 mb-10 flex-wrap">
              <div className="font-display text-5xl" style={{ color: primary }}>
                {business.google_rating ?? '—'}
              </div>
              <div>
                <div style={{ color: primary }} className="text-xl tracking-widest">
                  ★★★★★
                </div>
                <div className="font-mono text-xs uppercase mt-1" style={{ color: 'var(--ink-dim)' }}>
                  Based on {business.google_reviews_count ?? reviews.length} Google reviews
                </div>
              </div>
            </div>

            <div
              className="p-10 rounded-2xl border"
              style={{
                borderColor: 'var(--line)',
                background: 'var(--surface)',
                boxShadow: '0 22px 40px -20px rgba(0,0,0,.65)',
              }}
            >
              <div style={{ color: primary }} className="text-base tracking-widest mb-4">
                {'★'.repeat(reviews[reviewIdx].star_rating)}
              </div>
              <p className="text-lg mb-4" style={{ color: 'var(--ink)' }}>
                &quot;{reviews[reviewIdx].body}&quot;
              </p>
              <div className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--ink-dim)' }}>
                {reviews[reviewIdx].reviewer_name}
                {reviews[reviewIdx].timeframe && (
                  <em className="not-italic" style={{ color: primary }}>
                    {' '}
                    · {reviews[reviewIdx].timeframe}
                  </em>
                )}
              </div>
              <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: 'var(--line)' }}>
                <div className="flex gap-2">
                  {reviews.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setReviewIdx(i)}
                      className="w-2 h-2 rounded-full transition"
                      style={{
                        background: i === reviewIdx ? primary : 'var(--line)',
                        transform: i === reviewIdx ? 'scale(1.3)' : 'scale(1)',
                      }}
                      aria-label={`Review ${i + 1}`}
                    />
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setReviewIdx((reviewIdx - 1 + reviews.length) % reviews.length)}
                    className="w-11 h-11 rounded-full border flex items-center justify-center"
                    style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}
                    aria-label="Previous review"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setReviewIdx((reviewIdx + 1) % reviews.length)}
                    className="font-mono text-xs uppercase px-5 rounded-full flex items-center"
                    style={{ background: primary, color: '#101418' }}
                  >
                    Next Review ›
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Map + Contact */}
      {business.address && (
        <section
          id="contact"
          className="py-24 border-y"
          style={{ borderColor: 'var(--line)', background: 'rgba(29,34,39,.78)', backdropFilter: 'blur(3px)' }}
        >
          <div className="wrap">
            <div className="mb-10">
              <div className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: primary }}>
                Find Us
              </div>
              <h2 className="font-display uppercase text-4xl md:text-5xl">Location</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <iframe
                src={mapsEmbedUrl}
                className="w-full h-96 rounded-2xl border"
                style={{ borderColor: 'var(--line)', filter: 'grayscale(.3) contrast(1.1)' }}
                loading="lazy"
              />
              <div className="p-10 rounded-2xl border" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
                <InfoRow label="Address" icon="📍">
                  <a href={directionsUrl} target="_blank" rel="noopener" className="font-semibold">
                    {business.address}
                  </a>
                </InfoRow>
                {business.phone && (
                  <InfoRow label="Phone" icon="📞">
                    <a href={`tel:+${phoneHref}`} className="font-semibold">
                      {business.phone}
                    </a>
                  </InfoRow>
                )}
                {business.hours && (
                  <InfoRow label="Hours" icon="🕐">
                    <strong>{business.hours}</strong>
                  </InfoRow>
                )}
                {business.google_rating != null && (
                  <InfoRow label="Rating" icon="★">
                    <strong>
                      {business.google_rating} · {business.google_reviews_count} Google Reviews
                    </strong>
                  </InfoRow>
                )}
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener"
                  className="mt-6 block text-center font-mono text-sm uppercase tracking-wider px-6 py-4 rounded-xl"
                  style={{ background: primary, color: '#101418' }}
                >
                  Get Directions
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-16" style={{ background: 'rgba(29,34,39,.82)', backdropFilter: 'blur(3px)' }}>
        <div className="wrap text-center font-mono text-xs" style={{ color: 'var(--ink-dim)' }}>
          © {new Date().getFullYear()} {business.name} · Roofing Contractor
        </div>
      </footer>

      {/* Sticky mobile call */}
      {business.phone && (
        <a
          href={`tel:+${phoneHref}`}
          className="sm:hidden fixed bottom-0 inset-x-0 z-50 py-4 text-center font-mono text-sm uppercase tracking-wider"
          style={{ background: primary, color: '#101418' }}
        >
          📞 Call {business.phone}
        </a>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-10"
          style={{ background: 'rgba(10,12,14,.92)' }}
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-w-[90vw] max-h-[85vh] rounded-2xl" />
        </div>
      )}
    </main>
  );
}

function InfoRow({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-4 border-b" style={{ borderColor: 'var(--line)' }}>
      <span style={{ color: '#E2A23B' }}>{icon}</span>
      <div>
        <div className="font-mono text-[11px] uppercase tracking-widest mb-1" style={{ color: 'var(--ink-dim)' }}>
          {label}
        </div>
        {children}
      </div>
    </div>
  );
}

function shortName(name: string): string {
  const words = name.split(/\s+/);
  return words.length <= 3 ? name : words.slice(0, 3).join(' ');
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function shade(hex: string, pct: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + (v * pct) / 100)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
