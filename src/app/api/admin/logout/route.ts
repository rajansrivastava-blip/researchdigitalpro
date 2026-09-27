import { NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/server/auth';

export function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0 });
  return response;
}
