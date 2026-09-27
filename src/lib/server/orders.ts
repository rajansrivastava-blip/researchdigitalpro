import crypto from 'crypto';
import type { Product } from '@/types';
import { getDriveLinkFor } from './catalog';
import { addOrderIfNewPayment, type StoreConfig, type StoredOrder } from './storage';

export interface IssuePassInput {
  product: Product;
  config: StoreConfig;
  paymentId: string;
  orderId: string;
  customer: { name: string; email: string; phone: string };
}

/**
 * Creates the time-limited download pass for a verified payment.
 * Used by both the browser callback (verify-payment) and the Razorpay webhook.
 * Idempotent per payment ID: a second call returns the pass created by the first.
 */
export function issuePass({ product, config, paymentId, orderId, customer }: IssuePassInput) {
  const now = new Date();
  const order: StoredOrder = {
    orderId,
    token: crypto.randomBytes(20).toString('hex'),
    productId: product.id,
    productTitle: product.title,
    amount: product.price,
    currency: 'INR',
    customerName: customer.name || 'Customer',
    customerEmail: customer.email,
    customerPhone: customer.phone,
    razorpayPaymentId: paymentId,
    razorpayOrderId: orderId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + config.tokenExpiryHours * 60 * 60 * 1000).toISOString(),
    downloadCount: 0,
    maxDownloads: config.maxDownloadsPerToken,
    downloadLogs: [],
    status: 'active',
    // May be empty if no Drive link is configured yet; the download route then uses the current setting.
    hiddenTargetLink: getDriveLinkFor(product.id, config),
  };
  return addOrderIfNewPayment(order);
}
