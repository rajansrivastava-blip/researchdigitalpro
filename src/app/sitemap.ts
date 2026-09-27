import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

// Built per request so SITE_URL from the runtime environment is used.
export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number; changeFrequency: 'weekly' | 'yearly' }[] = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/refund-policy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/contact', priority: 0.5, changeFrequency: 'yearly' },
  ];
  return pages.map((p) => ({ url: `${SITE_URL}${p.path}`, changeFrequency: p.changeFrequency, priority: p.priority }));
}
