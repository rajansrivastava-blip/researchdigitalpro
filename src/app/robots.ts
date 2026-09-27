import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

// Built per request so SITE_URL from the runtime environment is used.
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/access'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
