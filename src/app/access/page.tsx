import type { Metadata } from 'next';
import { AccessPortal } from '@/components/AccessPortal';
import { toAccessDetails } from '@/lib/server/catalog';
import { findOrderByToken, loadConfig } from '@/lib/server/storage';

export const metadata: Metadata = {
  title: 'Your download pass',
  description: 'Open your purchased dataset, check your download link and recover a lost pass.',
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AccessPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = params.token;
  const token = ((Array.isArray(raw) ? raw[0] : raw) || '').trim().slice(0, 100);

  // Resolve the pass on the server so the page renders complete, and refresh / back / forward just work.
  const order = token ? findOrderByToken(token) : undefined;
  const initialData = order ? toAccessDetails(order, loadConfig()) : null;
  const initialError = token && !order ? 'We could not find a pass for that access code. Check the link, or use Find my pass below.' : null;

  return <AccessPortal key={token} initialToken={token} initialData={initialData} initialError={initialError} />;
}
