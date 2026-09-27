import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  SESSION_TTL_SECONDS,
  checkAdminPassword,
  createSessionValue,
  isAdminConfigured,
} from '@/lib/server/auth';
import { getRateLimitKey, jsonError, readJsonBody } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return jsonError('Admin access is disabled. Set ADMIN_PASSWORD in the server environment.', 503);
  }
  const limit = rateLimit(`admin-login:${getRateLimitKey(request)}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, error: `Too many login attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.` },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  const body = await readJsonBody(request);
  if (!checkAdminPassword(body.password)) {
    // Small fixed delay slows down password guessing.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return jsonError('Incorrect password.', 401);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, createSessionValue(), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
