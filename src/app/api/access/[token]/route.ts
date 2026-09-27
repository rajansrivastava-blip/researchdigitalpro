import { NextResponse } from 'next/server';
import { toAccessDetails } from '@/lib/server/catalog';
import { jsonError } from '@/lib/server/http';
import { findOrderByToken, loadConfig } from '@/lib/server/storage';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = findOrderByToken(token);
  if (!order) return jsonError('Invalid or unrecognized access token.', 404);

  return NextResponse.json(
    { success: true, ...toAccessDetails(order, loadConfig()) },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
