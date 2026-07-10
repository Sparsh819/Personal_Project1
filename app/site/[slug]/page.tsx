import { notFound } from 'next/navigation';
import { loadBusinessBundle } from '@/lib/loaders';
import { PublicSite } from '@/components/site/PublicSite';

export const dynamic = 'force-dynamic';

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = await loadBusinessBundle(slug);
  if (!bundle) return notFound();
  return <PublicSite bundle={bundle} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = await loadBusinessBundle(slug);
  if (!bundle) return { title: 'Not found' };
  return {
    title: `${bundle.business.name} — ${bundle.business.address ?? ''}`,
    description: bundle.business.tagline ?? bundle.business.description ?? '',
  };
}
