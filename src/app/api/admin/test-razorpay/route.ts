import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth';
import { readJsonBody, str } from '@/lib/server/http';
import { testRazorpayCredentials } from '@/lib/server/razorpay';
import { loadConfig } from '@/lib/server/storage';

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJsonBody(request);
  const config = loadConfig();
  // A blank secret in the form means "use the saved one".
  const keyId = str(body.keyId, 100) || config.razorpayKeyId || process.env.RAZORPAY_KEY_ID || '';
  const keySecret = str(body.keySecret, 200) || config.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || '';

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { success: false, error: 'Both Razorpay Key ID and Key Secret are required to test connection.' },
      { status: 400 }
    );
  }
  if (!keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')) {
    return NextResponse.json(
      { success: false, error: 'Key ID must start with "rzp_live_" (for real payments) or "rzp_test_" (for test payments).' },
      { status: 400 }
    );
  }

  try {
    const result = await testRazorpayCredentials(keyId, keySecret);
    if (result.ok) {
      const isLive = keyId.startsWith('rzp_live_');
      const mode = isLive ? 'Live Production' : 'Sandbox Test';
      return NextResponse.json({
        success: true,
        mode,
        isLive,
        message: `Verified! Successfully connected to your Razorpay ${mode} account. Customer payments are ready to process.`,
      });
    }
    const desc = result.description || `Authentication failed (HTTP ${result.status})`;
    return NextResponse.json(
      {
        success: false,
        error: `Razorpay rejected credentials: ${desc}. Double-check your Key ID & Secret from dashboard.razorpay.com/app/keys.`,
      },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: `Network error connecting to Razorpay API: ${message}` }, { status: 500 });
  }
}
