import { Wizard } from '@/components/wizard/Wizard';
import { supabaseConfigured } from '@/lib/supabase';
import Link from 'next/link';

export default function GeneratePage() {
  if (!supabaseConfigured()) {
    return (
      <main className="min-h-screen wrap py-16">
        <Link href="/" className="font-mono text-xs uppercase" style={{ color: 'var(--ink-dim)' }}>
          ← Back
        </Link>
        <h1 className="font-display uppercase text-4xl mt-4">Setup needed</h1>
        <p className="mt-4" style={{ color: 'var(--ink-dim)' }}>
          Set your Supabase env vars in <code>.env.local</code> first, then restart the dev server.
        </p>
      </main>
    );
  }
  return (
    <main className="min-h-screen">
      <header className="border-b" style={{ borderColor: 'var(--line)' }}>
        <div className="wrap flex items-center justify-between py-6">
          <Link href="/" className="font-display font-extrabold text-xl uppercase">
            RoofSite <span style={{ color: '#E2A23B' }}>Studio</span>
          </Link>
          <Link href="/" className="font-mono text-xs uppercase" style={{ color: 'var(--ink-dim)' }}>
            ← Dashboard
          </Link>
        </div>
      </header>
      <div className="wrap py-12">
        <Wizard mode="create" />
      </div>
    </main>
  );
}
