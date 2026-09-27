import { NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/constants';
import { getProduct } from '@/lib/server/catalog';
import { jsonError } from '@/lib/server/http';
import { issuePass } from '@/lib/server/orders';
import { verifyWebhookSignature } from '@/lib/server/razorpay';
import { loadConfig } from '@/lib/server/storage';

interface WebhookBody {
  event?: string;
  payload?: {
    order?: { entity?: { id?: string; amount?: number; amount_paid?: number; notes?: Record<string, string> } };
    payment?: { entity?: { id?: string; status?: string; email?: string; contact?: string } };
  };
}

/**
 * Razorpay webhook (Dashboard → Settings → Webhooks, event "order.paid").
 * Creates the download pass on the server even if the customer closed the tab before
 * the browser callback ran. Safe to receive more than once: issuePass() is idempotent.
 *
 * Unknown or irrelevant events get a 2xx so Razorpay does not keep retrying them.
 */
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  if (!secret) return jsonError('Webhook secret is not configured on the server.', 503);

  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';
  if (!signature || !verifyWebhookSignature(secret, rawBody, signature)) {
    return jsonError('Invalid webhook signature.', 400);
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return jsonError('Malformed webhook body.', 400);
  }

  if (body.event !== 'order.paid') return NextResponse.json({ success: true, ignored: body.event || 'unknown' });

  const order = body.payload?.order?.entity;
  const payment = body.payload?.payment?.entity;
  const product = getProduct(order?.notes?.productId);
  if (!order?.id || !payment?.id || !product) {
    console.warn('Webhook order.paid missing order, payment or product', { order: order?.id, payment: payment?.id });
    return NextResponse.json({ success: true, ignored: 'incomplete payload' });
  }

  const expectedAmount = Math.round(product.price * 100);
  if (order.amount !== expectedAmount || (order.amount_paid ?? 0) < expectedAmount) {
    console.warn('Webhook amount mismatch', { order: order.id, amount: order.amount, paid: order.amount_paid });
    return NextResponse.json({ success: true, ignored: 'amount mismatch' });
  }

  const notes = order.notes || {};
  const email = isValidEmail(notes.customerEmail) ? notes.customerEmail : payment.email || '';
  if (!isValidEmail(email)) {
    console.warn('Webhook payment has no valid customer email', { order: order.id });
    return NextResponse.json({ success: true, ignored: 'no customer email' });
  }

  const { created } = issuePass({
    product,
    config: loadConfig(),
    paymentId: payment.id,
    orderId: order.id,
    customer: { name: notes.customerName || '', email, phone: notes.customerPhone || payment.contact || '' },
  });
  return NextResponse.json({ success: true, created });
}
