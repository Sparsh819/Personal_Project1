import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadBusinessBundle } from '@/lib/loaders';
import { Wizard } from '@/components/wizard/Wizard';

export const dynamic = 'force-dynamic';

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const { token } = await searchParams;
  const bundle = await loadBusinessBundle(slug);
  if (!bundle) return notFound();

  const validToken = token && token === bundle.business.edit_token;

  return (
    <main className="min-h-screen">
      <header className="border-b" style={{ borderColor: 'var(--line)' }}>
        <div className="wrap flex items-center justify-between py-6">
          <Link href="/" className="font-display font-extrabold text-xl uppercase">
            RoofSite <span style={{ color: '#E2A23B' }}>Studio</span>
          </Link>
          <div className="flex gap-4">
            <Link
              href={`/site/${slug}`}
              target="_blank"
              className="font-mono text-xs uppercase px-4 py-2 rounded-lg border"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              View live site →
            </Link>
            <Link href="/" className="font-mono text-xs uppercase" style={{ color: 'var(--ink-dim)' }}>
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="wrap py-12">
        <div className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: '#E2A23B' }}>
          Admin panel · {bundle.business.name}
        </div>
        <h1 className="font-display uppercase text-4xl mb-8">Edit your site</h1>

        {!validToken ? (
          <div
            className="p-8 rounded-2xl border max-w-lg"
            style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}
          >
            <div className="font-display uppercase text-2xl mb-3">Access needed</div>
            <p style={{ color: 'var(--ink-dim)' }} className="mb-4">
              This admin panel is gated by an edit token. Add <code>?token=YOUR_TOKEN</code> to the URL.
            </p>
            <p style={{ color: 'var(--ink-dim)' }} className="text-sm">
              If you&apos;re the operator, grab the token from the dashboard&apos;s Edit link.
            </p>
          </div>
        ) : (
          <Wizard
            mode="edit"
            initial={{
              business: bundle.business,
              services: bundle.services,
              photos: bundle.photos,
              reviews: bundle.reviews,
              token: bundle.business.edit_token,
            }}
          />
        )}
      </div>
    </main>
  );
}
