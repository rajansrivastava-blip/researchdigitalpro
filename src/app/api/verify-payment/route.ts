import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/constants';
import { getProduct } from '@/lib/server/catalog';
import { jsonError, readJsonBody, str } from '@/lib/server/http';
import { issuePass } from '@/lib/server/orders';
import {
  fetchRazorpayOrder,
  getRazorpayCredentials,
  isSandboxAllowed,
  verifyPaymentSignature,
} from '@/lib/server/razorpay';
import { findOrderByPayment, loadConfig, type StoredOrder } from '@/lib/server/storage';
import type { PaymentResult } from '@/types';

function toPaymentResult(order: StoredOrder, message: string): PaymentResult {
  return {
    success: true,
    message,
    token: order.token,
    expiresAt: order.expiresAt,
    maxDownloads: order.maxDownloads,
    downloadCount: order.downloadCount,
    productTitle: order.productTitle,
    orderId: order.orderId,
    paymentId: order.razorpayPaymentId,
    recipientEmail: order.customerEmail,
  };
}

/** Browser callback after Razorpay Checkout succeeds. The webhook is the backup path for the same payment. */
export async function POST(request: Request) {
  const body = await readJsonBody(request);
  let customerEmail = str(body.customerEmail, 254);
  let customerName = str(body.customerName, 120);
  let customerPhone = str(body.customerPhone, 20);

  if (!body.productId || !customerEmail) return jsonError('Missing required purchase details.', 400);
  if (!isValidEmail(customerEmail)) return jsonError('Please enter a valid email address.', 400);

  const product = getProduct(body.productId);
  if (!product) return jsonError('Product not found.', 404);

  const config = loadConfig();
  const creds = getRazorpayCredentials(config);
  let paymentId: string;
  let orderId: string;

  if (creds.isConfigured) {
    // A valid signature is mandatory. It proves Razorpay completed payment for this order.
    const rzpPaymentId = str(body.razorpay_payment_id, 100);
    const rzpOrderId = str(body.razorpay_order_id, 100);
    const rzpSignature = str(body.razorpay_signature, 200);
    if (!rzpPaymentId || !rzpOrderId || !rzpSignature) {
      return jsonError('Payment confirmation from Razorpay is missing. Verification failed.', 400);
    }
    if (!verifyPaymentSignature(creds.keySecret, rzpOrderId, rzpPaymentId, rzpSignature)) {
      return jsonError('Invalid payment signature. Verification failed.', 400);
    }

    // Fast path: this payment already has a pass (replay, retry, or created by the webhook).
    const existing = findOrderByPayment(rzpPaymentId);
    if (existing) return NextResponse.json(toPaymentResult(existing, 'Payment already verified. Access granted.'));

    // The order must have been created for this product at this price.
    // Stops a buyer from paying for a cheap dataset and claiming an expensive one.
    const rzpOrder = await fetchRazorpayOrder(creds, rzpOrderId);
    if (!rzpOrder) return jsonError('Could not confirm the order with Razorpay. Please contact support.', 502);
    if (rzpOrder.notes?.productId !== product.id || rzpOrder.amount !== Math.round(product.price * 100)) {
      return jsonError('This payment does not match the selected product.', 400);
    }
    if (rzpOrder.notes?.customerEmail && isValidEmail(rzpOrder.notes.customerEmail)) {
      customerEmail = rzpOrder.notes.customerEmail;
      customerName = rzpOrder.notes.customerName || customerName;
      customerPhone = rzpOrder.notes.customerPhone || customerPhone;
    }

    paymentId = rzpPaymentId;
    orderId = rzpOrderId;
  } else if (isSandboxAllowed()) {
    paymentId = `pay_sim_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    orderId = `order_sim_${crypto.randomBytes(8).toString('hex')}`;
  } else {
    return jsonError('Online payments are not configured yet. Please contact support to complete your purchase.', 503);
  }

  const { order, created } = issuePass({
    product,
    config,
    paymentId,
    orderId,
    customer: { name: customerName, email: customerEmail, phone: customerPhone },
  });
  return NextResponse.json(
    toPaymentResult(order, created ? 'Payment verified successfully. Access granted.' : 'Payment already verified. Access granted.')
  );
}
