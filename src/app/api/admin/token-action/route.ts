import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth';
import { jsonError, readJsonBody, str } from '@/lib/server/http';
import { updateOrder } from '@/lib/server/storage';

const ACTIONS = ['revoke', 'extend_24h', 'reset_downloads'] as const;
type Action = (typeof ACTIONS)[number];

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJsonBody(request);
  const token = str(body.token, 100);
  const action = body.action as Action;
  if (!ACTIONS.includes(action)) return jsonError('Unknown action.', 400);

  const order = updateOrder(token, (o) => {
    if (action === 'revoke') {
      o.status = 'revoked';
    } else if (action === 'extend_24h') {
      const base = Math.max(Date.now(), new Date(o.expiresAt).getTime());
      o.expiresAt = new Date(base + 24 * 60 * 60 * 1000).toISOString();
      o.status = 'active';
    } else if (action === 'reset_downloads') {
      o.downloadCount = 0;
    }
  });
  if (!order) return jsonError('Order not found.', 404);

  return NextResponse.json({ success: true, order });
}
