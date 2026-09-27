import { NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/constants';
import { requireAdmin } from '@/lib/server/auth';
import { jsonError, readJsonBody, str } from '@/lib/server/http';
import { loadConfig, saveConfig, toAdminConfig } from '@/lib/server/storage';

function intInRange(value: unknown, min: number, max: number): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJsonBody(request);
  const config = loadConfig();

  if (body.masterDriveLink !== undefined) {
    const link = str(body.masterDriveLink, 2000);
    if (!/^https:\/\//i.test(link)) return jsonError('Master Drive link must be an https:// URL.', 400);
    config.masterDriveLink = link;
  }

  if (body.razorpayKeyId !== undefined) {
    const keyId = str(body.razorpayKeyId, 100);
    if (keyId && !keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')) {
      return jsonError('Razorpay Key ID must start with rzp_live_ or rzp_test_.', 400);
    }
    config.razorpayKeyId = keyId;
  }

  // The secret is write-only. An empty value keeps the stored secret.
  const secret = str(body.razorpayKeySecret, 200);
  if (secret) config.razorpayKeySecret = secret;

  if (body.tokenExpiryHours !== undefined) {
    const hours = intInRange(body.tokenExpiryHours, 1, 168);
    if (hours === null) return jsonError('Token expiry must be a whole number between 1 and 168 hours.', 400);
    config.tokenExpiryHours = hours;
  }

  if (body.maxDownloadsPerToken !== undefined) {
    const max = intInRange(body.maxDownloadsPerToken, 1, 50);
    if (max === null) return jsonError('Download limit must be a whole number between 1 and 50.', 400);
    config.maxDownloadsPerToken = max;
  }

  if (body.supportEmail !== undefined && str(body.supportEmail)) {
    if (!isValidEmail(body.supportEmail)) return jsonError('Support email is not valid.', 400);
    config.supportEmail = str(body.supportEmail, 254);
  }

  saveConfig(config);
  return NextResponse.json({ success: true, config: toAdminConfig(config) });
}
