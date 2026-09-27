import crypto from 'crypto';
import type { StoreConfig } from './storage';

const PLACEHOLDER_KEY_ID = 'rzp_test_AiStudioStore2026';
const PLACEHOLDER_SECRET = 'test_secret_vault_secure_key';
// RAZORPAY_API_BASE is only for automated tests against a local mock. Leave it unset in real use.
const RAZORPAY_API = process.env.RAZORPAY_API_BASE || 'https://api.razorpay.com/v1';

export interface RazorpayCredentials {
  keyId: string;
  keySecret: string;
  isConfigured: boolean;
  isLive: boolean;
}

export function getRazorpayCredentials(config: StoreConfig): RazorpayCredentials {
  const keyId = (config.razorpayKeyId || process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (config.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || '').trim();
  const hasKey =
    keyId.length > 0 &&
    keyId !== PLACEHOLDER_KEY_ID &&
    (keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_'));
  const hasSecret = keySecret.length > 0 && keySecret !== PLACEHOLDER_SECRET;
  return {
    keyId: hasKey ? keyId : '',
    keySecret,
    isConfigured: hasKey && hasSecret,
    isLive: keyId.startsWith('rzp_live_'),
  };
}

/**
 * Simulated (free) checkout is only allowed when Razorpay is not configured AND
 * we are in development, unless the owner explicitly opts in for production.
 */
export function isSandboxAllowed(): boolean {
  return process.env.ALLOW_SANDBOX_PAYMENTS === 'true' || process.env.NODE_ENV !== 'production';
}

function authHeader(creds: Pick<RazorpayCredentials, 'keyId' | 'keySecret'>) {
  return `Basic ${Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64')}`;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  notes?: Record<string, string>;
}

export async function createRazorpayOrder(
  creds: RazorpayCredentials,
  body: { amount: number; currency: string; receipt: string; notes: Record<string, string> }
): Promise<{ ok: true; order: RazorpayOrder } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${RAZORPAY_API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader(creds) },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true, order: (await res.json()) as RazorpayOrder };
    const errBody = (await res.json().catch(() => null)) as { error?: { description?: string } } | null;
    console.error('Razorpay order error:', res.status, errBody);
    return { ok: false, error: errBody?.error?.description || `Razorpay returned HTTP ${res.status}` };
  } catch (err) {
    console.error('Razorpay network error:', err);
    return { ok: false, error: 'Could not reach Razorpay. Please try again.' };
  }
}

export async function fetchRazorpayOrder(creds: RazorpayCredentials, orderId: string): Promise<RazorpayOrder | null> {
  try {
    const res = await fetch(`${RAZORPAY_API}/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: authHeader(creds) },
    });
    if (!res.ok) return null;
    return (await res.json()) as RazorpayOrder;
  } catch {
    return null;
  }
}

export async function testRazorpayCredentials(keyId: string, keySecret: string): Promise<{ ok: boolean; status: number; description?: string }> {
  const res = await fetch(`${RAZORPAY_API}/orders?count=1`, { headers: { Authorization: authHeader({ keyId, keySecret }) } });
  if (res.ok) return { ok: true, status: res.status };
  const errBody = (await res.json().catch(() => null)) as { error?: { description?: string } } | null;
  return { ok: false, status: res.status, description: errBody?.error?.description };
}

function hmacMatches(secret: string, payload: string, signature: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const a = Buffer.from(expected, 'utf-8');
  const b = Buffer.from(signature, 'utf-8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Constant-time check of Razorpay's `order_id|payment_id` HMAC signature (Standard Checkout). */
export function verifyPaymentSignature(secret: string, orderId: string, paymentId: string, signature: string): boolean {
  return hmacMatches(secret, `${orderId}|${paymentId}`, signature);
}

/** Constant-time check of the `X-Razorpay-Signature` header over the raw webhook body. */
export function verifyWebhookSignature(webhookSecret: string, rawBody: string, signature: string): boolean {
  return hmacMatches(webhookSecret, rawBody, signature);
}
