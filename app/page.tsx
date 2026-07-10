import Link from 'next/link';
import { supabaseConfigured, supabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const configured = supabaseConfigured();
  let businesses: { slug: string; name: string; address: string | null; edit_token: string }[] = [];
  let loadError: string | null = null;

  if (configured) {
    const sb = supabaseServer();
    const { data, error } = await sb
      .from('businesses')
      .select('slug,name,address,edit_token')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) loadError = error.message;
    else businesses = data ?? [];
  }

  return (
    <main className="min-h-screen">
      <header className="border-b" style={{ borderColor: 'var(--line)' }}>
        <div className="wrap flex items-center justify-between py-6">
          <div className="font-display font-extrabold text-2xl uppercase tracking-wide">
            RoofSite <span style={{ color: '#E2A23B' }}>Studio</span>
          </div>
          <Link
            href="/generate"
            className="font-mono text-sm uppercase tracking-wider px-5 py-3 rounded-xl"
            style={{ background: '#E2A23B', color: '#101418' }}
          >
            New Site →
          </Link>
        </div>
      </header>

      <section className="wrap py-16">
        <div className="font-mono text-xs uppercase tracking-widest" style={{ color: '#E2A23B' }}>
          Operator Dashboard
        </div>
        <h1 className="font-display font-extrabold uppercase text-5xl mt-2 mb-4 leading-none">
          Generate roofing sites <br /> in about four minutes.
        </h1>
        <p className="max-w-xl" style={{ color: 'var(--ink-dim)' }}>
          Paste a Google Business description, drop in some photos, add real reviews, click generate.
          Each site gets a public URL and an admin link the owner can use to update it later.
        </p>

        {!configured && (
          <div className="mt-8 p-6 rounded-2xl border" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
            <div className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: '#E2A23B' }}>
              Setup needed
            </div>
            <p style={{ color: 'var(--ink)' }}>
              Supabase environment variables aren&apos;t set yet. Copy <code>.env.local.example</code> to{' '}
              <code>.env.local</code>, fill in your Supabase URL and anon key, then restart{' '}
              <code>npm run dev</code>.
            </p>
          </div>
        )}

        {configured && loadError && (
          <div className="mt-8 p-6 rounded-2xl border text-red-300" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
            Couldn&apos;t load businesses: {loadError}
            <p className="mt-2 text-sm" style={{ color: 'var(--ink-dim)' }}>
              Have you run the SQL migration in Supabase yet? (<code>supabase/schema.sql</code>)
            </p>
          </div>
        )}

        {configured && !loadError && (
          <div className="mt-12">
            <h2 className="font-display uppercase text-2xl mb-6">Existing sites</h2>
            {businesses.length === 0 ? (
              <p style={{ color: 'var(--ink-dim)' }}>
                No sites yet.{' '}
                <Link href="/generate" style={{ color: '#E2A23B' }}>
                  Generate the first one.
                </Link>
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {businesses.map((b) => (
                  <div
                    key={b.slug}
                    className="p-5 rounded-2xl border"
                    style={{
                      borderColor: 'var(--line)',
                      background: 'var(--surface)',
                      boxShadow: '0 22px 40px -20px rgba(0,0,0,.65)',
                    }}
                  >
                    <div className="font-display font-bold uppercase text-lg leading-tight">{b.name}</div>
                    <div className="font-mono text-xs mt-2" style={{ color: 'var(--ink-dim)' }}>
                      {b.address ?? 'No address'}
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Link
                        href={`/site/${b.slug}`}
                        target="_blank"
                        className="font-mono text-xs uppercase px-3 py-2 rounded-lg border"
                        style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/${b.slug}?token=${b.edit_token}`}
                        className="font-mono text-xs uppercase px-3 py-2 rounded-lg"
                        style={{ background: '#E2A23B', color: '#101418' }}
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
