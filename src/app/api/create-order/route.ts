import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/constants';
import { getProduct } from '@/lib/server/catalog';
import { jsonError, readJsonBody, str } from '@/lib/server/http';
import { createRazorpayOrder, getRazorpayCredentials, isSandboxAllowed } from '@/lib/server/razorpay';
import { loadConfig } from '@/lib/server/storage';

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  const customerEmail = str(body.customerEmail, 254);
  const customerName = str(body.customerName, 120);
  const customerPhone = str(body.customerPhone, 20);

  if (!body.productId || !customerEmail) return jsonError('Product ID and Customer Email are required.', 400);
  if (!isValidEmail(customerEmail)) return jsonError('Please enter a valid email address.', 400);

  const product = getProduct(body.productId);
  if (!product) return jsonError('Product not found.', 404);

  const creds = getRazorpayCredentials(loadConfig());
  const amountInPaise = Math.round(product.price * 100);
  let orderId: string;

  if (creds.isConfigured) {
    const result = await createRazorpayOrder(creds, {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      notes: { productId: product.id, productTitle: product.title, customerEmail, customerName, customerPhone },
    });
    if (!result.ok) {
      return jsonError(`Razorpay Error: ${result.error}. Please verify your Key ID & Secret in Store Settings.`, 502);
    }
    orderId = result.order.id;
  } else if (isSandboxAllowed()) {
    orderId = `order_sim_${crypto.randomBytes(8).toString('hex')}`;
  } else {
    return jsonError('Online payments are not configured yet. Please contact support to complete your purchase.', 503);
  }

  return NextResponse.json({
    success: true,
    orderId,
    amount: amountInPaise,
    amountInInr: product.price,
    currency: 'INR',
    keyId: creds.keyId,
    isConfigured: creds.isConfigured,
    isLiveOrder: creds.isConfigured,
    product: { id: product.id, title: product.title, price: product.price },
    customer: { name: customerName || 'Valued Customer', email: customerEmail, phone: customerPhone },
  });
}
