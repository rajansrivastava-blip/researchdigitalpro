import { NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/constants';
import { getRateLimitKey, jsonError, readJsonBody, str } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';
import { loadOrders } from '@/lib/server/storage';

/**
 * "Find my pass": returns the access token when BOTH the checkout email and the
 * Razorpay payment ID match. Rate-limited per IP to stop guessing.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`lookup:${getRateLimitKey(request)}`, 10, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, error: `Too many attempts. Please try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.` },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  const body = await readJsonBody(request);
  const email = str(body.email, 254).toLowerCase();
  const paymentId = str(body.paymentId, 100);
  if (!isValidEmail(email) || !paymentId) return jsonError('Enter the email you used at checkout and your payment ID.', 400);

  const order = loadOrders().find((o) => o.razorpayPaymentId === paymentId && o.customerEmail.toLowerCase() === email);
  if (!order) return jsonError('No pass matches that email and payment ID. Check both and try again.', 404);

  return NextResponse.json({ success: true, token: order.token }, { headers: { 'Cache-Control': 'no-store' } });
}
