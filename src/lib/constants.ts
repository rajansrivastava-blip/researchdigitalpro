export const BRAND_NAME = 'Research Digital Pro';
export const BRAND_SHORT = 'Research Digital';
export const DEFAULT_SUPPORT_EMAIL = 'helpeasemymart@gmail.com';

/**
 * Public site URL for canonical links, sitemap and social previews. Set SITE_URL in production.
 * Read at request time on the server (not inlined at build), so one build works for any domain.
 */
export const SITE_URL = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

export const SITE_DESCRIPTION =
  'Buy B2B and consumer contact datasets as CSV/XLSX files. Pay securely with Razorpay and get a private download link instantly.';

/** Basic shape check for an email address. Used on both client and server. */
export const EMAIL_PATTERN = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && EMAIL_PATTERN.test(value.trim());
}
