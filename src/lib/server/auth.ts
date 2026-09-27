import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const ADMIN_COOKIE = 'rdp_admin_session';
export const SESSION_TTL_SECONDS = 12 * 60 * 60;

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || '';
}

export function isAdminConfigured(): boolean {
  return adminPassword().length > 0;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', adminPassword()).update(`rdp-admin:${payload}`).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf-8');
  const bb = Buffer.from(b, 'utf-8');
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export function checkAdminPassword(input: unknown): boolean {
  if (!isAdminConfigured() || typeof input !== 'string') return false;
  const hash = (v: string) => crypto.createHash('sha256').update(v).digest('hex');
  return safeEqual(hash(input), hash(adminPassword()));
}

/** Creates a signed, expiring session value: `<expiryUnixSeconds>.<hmac>`. */
export function createSessionValue(): string {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return `${expires}.${sign(String(expires))}`;
}

function isValidSession(value: string | undefined): boolean {
  if (!value || !isAdminConfigured()) return false;
  const [expires, mac] = value.split('.');
  if (!expires || !mac || Number(expires) * 1000 < Date.now()) return false;
  return safeEqual(mac, sign(expires));
}

export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  return isValidSession(store.get(ADMIN_COOKIE)?.value);
}

/** Returns an error response when the caller is not an authenticated admin, else null. */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: 'Admin access is disabled. Set ADMIN_PASSWORD in the server environment.' },
      { status: 503 }
    );
  }
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }
  return null;
}
