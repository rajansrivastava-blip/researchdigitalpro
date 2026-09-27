// End-to-end API test of the configured-gateway payment flow.
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const B = process.env.E2E_BASE_URL || 'http://localhost:3110';
const SECRET = 'e2e_test_secret';
const DATA_DIR = process.env.E2E_DATA_DIR;
const results = [];
let cookie = '';

const sign = (orderId, paymentId) => crypto.createHmac('sha256', SECRET).update(`${orderId}|${paymentId}`).digest('hex');
const check = (name, cond, detail = '') => results.push({ ok: !!cond, name, detail });

async function call(method, p, body, extra = {}) {
  const res = await fetch(B + p, {
    method,
    redirect: 'manual',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...extra },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text, headers: res.headers };
}

const buyer = { customerName: 'E2E Buyer', customerEmail: 'e2e.buyer@example.com', customerPhone: '+919800000000' };

// 1. Store reports a configured gateway
let r = await call('GET', '/api/products');
const si = r.json?.storeInfo || {};
check('Store shows gateway configured, sandbox off', si.isConfigured === true && si.sandboxAllowed === false && si.razorpayKeyId === 'rzp_test_E2EKEY', JSON.stringify(si));

// 2. Validation
r = await call('POST', '/api/create-order', { productId: 'us-data', customerEmail: 'bad-email' });
check('Invalid email rejected', r.status === 400, r.json?.error);
r = await call('POST', '/api/create-order', { productId: 'nope', customerEmail: buyer.customerEmail });
check('Unknown product rejected', r.status === 404, r.json?.error);

// 3. Create a real (mock) Razorpay order
r = await call('POST', '/api/create-order', { productId: 'us-data', ...buyer });
const order = r.json || {};
check('Order created at Razorpay with correct amount', r.status === 200 && order.orderId?.startsWith('order_') && order.amount === 7900 && order.isConfigured === true, `${order.orderId} amount=${order.amount}`);

// 4. Tampering attempts
r = await call('POST', '/api/verify-payment', { productId: 'us-data', ...buyer, razorpay_order_id: order.orderId });
check('Missing signature rejected', r.status === 400, r.json?.error);
r = await call('POST', '/api/verify-payment', { productId: 'us-data', ...buyer, razorpay_order_id: order.orderId, razorpay_payment_id: 'pay_E2E1', razorpay_signature: 'f'.repeat(64) });
check('Forged signature rejected', r.status === 400, r.json?.error);
r = await call('POST', '/api/verify-payment', { productId: 'us-data', ...buyer, razorpay_order_id: 'order_doesnotexist', razorpay_payment_id: 'pay_E2E1', razorpay_signature: sign('order_doesnotexist', 'pay_E2E1') });
check('Order unknown to Razorpay rejected', r.status === 502, r.json?.error);

// 5. Genuine success
const payId = `pay_E2E${Date.now()}`;
r = await call('POST', '/api/verify-payment', { productId: 'us-data', ...buyer, razorpay_order_id: order.orderId, razorpay_payment_id: payId, razorpay_signature: sign(order.orderId, payId) });
const pass = r.json || {};
check('Valid payment issues a download pass', r.status === 200 && /^[0-9a-f]{40}$/.test(pass.token || '') && pass.paymentId === payId, `token=${pass.token?.slice(0, 8)}…`);

// 6. Replay of the same payment returns the same pass (no duplicate)
r = await call('POST', '/api/verify-payment', { productId: 'us-data', ...buyer, razorpay_order_id: order.orderId, razorpay_payment_id: payId, razorpay_signature: sign(order.orderId, payId) });
check('Replayed payment does not mint a second pass', r.status === 200 && r.json?.token === pass.token, r.json?.message);

// 7. Price-swap attack: pay for ₹49 product, claim ₹249 bundle
r = await call('POST', '/api/create-order', { productId: 'global-b2b', ...buyer });
const cheap = r.json;
const cheapPay = `pay_E2Echeap${Date.now()}`;
r = await call('POST', '/api/verify-payment', { productId: 'all-drive-bundle', ...buyer, razorpay_order_id: cheap.orderId, razorpay_payment_id: cheapPay, razorpay_signature: sign(cheap.orderId, cheapPay) });
check('₹49 payment cannot unlock ₹249 bundle', r.status === 400, r.json?.error);

// 8. Access details
r = await call('GET', `/api/access/${pass.token}`);
check('Access pass is active with 5 downloads', r.json?.accessStatus === 'active' && r.json?.downloadsRemaining === 5 && r.json?.amount === 79, `${r.json?.accessStatus} remaining=${r.json?.downloadsRemaining}`);

// 9. Downloads up to the limit
const codes = [];
for (let i = 0; i < 5; i++) codes.push((await call('GET', `/api/download/${pass.token}`)).status);
const loc = (await fetch(`${B}/api/access/${pass.token}`).then((x) => x.json())).downloadCount;
check('5 downloads redirect to Drive', codes.every((c) => c === 302), codes.join(','));
r = await call('GET', `/api/download/${pass.token}`);
check('6th download blocked (limit reached)', r.status === 429 && r.text.includes('Max Downloads Reached'), `status=${r.status} count=${loc}`);
r = await call('GET', `/api/access/${pass.token}`);
check('Access shows limit_reached', r.json?.accessStatus === 'limit_reached', r.json?.accessStatus);

// 10. Admin actions
r = await call('GET', '/api/admin/orders');
check('Admin data blocked without login', r.status === 401);
r = await call('POST', '/api/admin/login', { password: process.env.E2E_ADMIN_PASSWORD });
cookie = (r.headers.get('set-cookie') || '').split(';')[0];
check('Admin login works', r.status === 200 && cookie.startsWith('rdp_admin_session='));
r = await call('GET', '/api/admin/orders');
const mine = r.json?.orders?.filter((o) => o.customerEmail === buyer.customerEmail) || [];
check('Admin sees exactly one order for the buyer, revenue ₹79', mine.length === 1 && r.json?.summary?.totalRevenue === 79 && mine[0].downloadLogs.length === 5, `orders=${mine.length} revenue=${r.json?.summary?.totalRevenue}`);
check('Admin config never exposes the Razorpay secret', !JSON.stringify(r.json?.config).includes(SECRET) && r.json?.config?.razorpayKeySecretSet === true);

r = await call('POST', '/api/admin/token-action', { token: pass.token, action: 'reset_downloads' });
const afterReset = (await call('GET', `/api/download/${pass.token}`)).status;
check('Reset downloads lets the customer download again', r.status === 200 && afterReset === 302, `download=${afterReset}`);

r = await call('POST', '/api/admin/token-action', { token: pass.token, action: 'revoke' });
const revoked = await call('GET', `/api/download/${pass.token}`);
check('Revoked pass is blocked', revoked.status === 403 && revoked.text.includes('Access Revoked'));

r = await call('POST', '/api/admin/token-action', { token: pass.token, action: 'extend_24h' });
const restored = await call('GET', `/api/access/${pass.token}`);
check('Restore / extend reactivates the pass', restored.json?.accessStatus === 'active', restored.json?.accessStatus);

// 11. Expiry (move expiresAt into the past on disk)
const file = path.join(DATA_DIR, 'orders.json');
const all = JSON.parse(fs.readFileSync(file, 'utf-8'));
all.find((o) => o.token === pass.token).expiresAt = new Date(Date.now() - 60_000).toISOString();
fs.writeFileSync(file, JSON.stringify(all, null, 2));
const expired = await call('GET', `/api/download/${pass.token}`);
check('Expired pass is blocked with renewal link', expired.status === 410 && expired.text.includes(`/access?token=${pass.token}`));
const expAccess = await call('GET', `/api/access/${pass.token}`);
check('Access shows expired', expAccess.json?.accessStatus === 'expired');

// 12. The fake "resend email" endpoint is gone
r = await call('POST', '/api/resend-email', { token: pass.token });
check('Removed resend-email endpoint no longer exists', r.status === 404 || r.status === 405, `status=${r.status}`);

// 13. Legacy link redirect
r = await call('GET', `/?token=${pass.token}`);
check('Old /?token= link redirects to /access', r.status === 307 && (r.headers.get('location') || '').includes(`/access?token=${pass.token}`));

// 14. Access page renders the pass on the server (works on refresh / back)
r = await call('GET', `/access?token=${pass.token}`);
check('Access page is server-rendered with pass details', r.status === 200 && r.text.includes(pass.token.slice(0, 12)) && r.text.includes('USA B2B'));
r = await call('GET', '/access?token=doesnotexist');
check('Unknown access code shows a friendly message', r.status === 200 && r.text.includes('could not find a pass'));

// 15. Razorpay webhook (order.paid) creates a pass even if the browser never reports back
const WH_SECRET = 'e2e_webhook_secret';
const whSign = (raw) => crypto.createHmac('sha256', WH_SECRET).update(raw).digest('hex');
const postWebhook = (payload, signature) =>
  fetch(`${B}/api/razorpay/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(signature ? { 'X-Razorpay-Signature': signature } : {}) },
    body: payload,
  }).then(async (res) => ({ status: res.status, json: await res.json().catch(() => null) }));

const whBuyer = { customerName: 'Webhook Buyer', customerEmail: 'webhook.buyer@example.com', customerPhone: '' };
r = await call('POST', '/api/create-order', { productId: 'tech-founders', ...whBuyer });
const whOrder = r.json;
const whPayId = `pay_WH${Date.now()}`;
const paid = (amount) =>
  JSON.stringify({
    event: 'order.paid',
    payload: {
      order: { entity: { id: whOrder.orderId, amount, amount_paid: amount, notes: { productId: 'tech-founders', ...whBuyer } } },
      payment: { entity: { id: whPayId, status: 'captured', email: whBuyer.customerEmail } },
    },
  });

let w = await postWebhook(paid(4900));
check('Webhook without signature rejected', w.status === 400);
w = await postWebhook(paid(4900), 'a'.repeat(64));
check('Webhook with wrong signature rejected', w.status === 400);
const badAmount = paid(100);
w = await postWebhook(badAmount, whSign(badAmount));
check('Webhook with wrong amount is ignored (no pass)', w.status === 200 && w.json?.ignored === 'amount mismatch');
const other = JSON.stringify({ event: 'payment.failed', payload: {} });
w = await postWebhook(other, whSign(other));
check('Irrelevant webhook events are acknowledged and ignored', w.status === 200 && w.json?.ignored === 'payment.failed');
const good = paid(4900);
w = await postWebhook(good, whSign(good));
check('Valid order.paid webhook creates the pass', w.status === 200 && w.json?.created === true, JSON.stringify(w.json));
w = await postWebhook(good, whSign(good));
check('Duplicate webhook does not create a second pass', w.status === 200 && w.json?.created === false);

// Browser callback arriving after the webhook returns the same pass
r = await call('POST', '/api/verify-payment', {
  productId: 'tech-founders',
  ...whBuyer,
  razorpay_order_id: whOrder.orderId,
  razorpay_payment_id: whPayId,
  razorpay_signature: sign(whOrder.orderId, whPayId),
});
const whToken = r.json?.token;
check('Browser callback after webhook reuses the same pass', r.status === 200 && /^[0-9a-f]{40}$/.test(whToken || ''));

// 16. Find my pass (email + payment ID)
r = await call('POST', '/api/access/lookup', { email: 'WEBHOOK.buyer@example.com', paymentId: whPayId });
check('Find my pass works with email + payment ID (email case-insensitive)', r.status === 200 && r.json?.token === whToken);
r = await call('POST', '/api/access/lookup', { email: 'someone.else@example.com', paymentId: whPayId });
check('Find my pass rejects a wrong email', r.status === 404);
r = await call('POST', '/api/access/lookup', { email: 'not-an-email', paymentId: '' });
check('Find my pass validates input', r.status === 400);
r = await call('GET', '/api/admin/orders');
const whOrders = r.json?.orders?.filter((o) => o.razorpayPaymentId === whPayId) || [];
check('Exactly one order exists for the webhook payment', whOrders.length === 1, `count=${whOrders.length}`);

// 17. Public pages, SEO files and 404
for (const path of ['/terms', '/privacy', '/refund-policy', '/contact']) {
  r = await call('GET', path);
  check(`${path} loads with brand and canonical`, r.status === 200 && r.text.includes('Research Digital Pro') && r.text.includes(`rel="canonical" href="${B}${path}"`));
}
r = await call('GET', '/');
check('Home has correct title, canonical and Product JSON-LD', r.status === 200 && r.text.includes('<title>Research Digital Pro') && r.text.includes(`rel="canonical" href="${B}"`) && r.text.includes('"@type":"Product"') && !r.text.includes('aggregateRating'));
check('No "Dital" typo left on the home page', !r.text.includes('Dital'));
check('No unverifiable compliance claims on the home page', !/GDPR|PCI-DSS|RBI-authorized|256-bit|bounce rate/i.test(r.text));
check('Razorpay script is not loaded on the home page', !r.text.includes('checkout.razorpay.com'));
r = await call('GET', '/robots.txt');
check('robots.txt blocks /admin, /api and /access', r.status === 200 && r.text.includes('Disallow: /admin') && r.text.includes('Disallow: /api/') && r.text.includes('Disallow: /access') && r.text.includes('Sitemap:'));
r = await call('GET', '/sitemap.xml');
check('sitemap.xml lists home and legal pages', r.status === 200 && ['/terms', '/privacy', '/refund-policy', '/contact'].every((p) => r.text.includes(`${B}${p}`)));
r = await call('GET', '/icon.svg');
check('Favicon is served', r.status === 200 && (r.headers.get('content-type') || '').includes('svg'));
r = await call('GET', '/opengraph-image');
check('Social preview image is generated', r.status === 200 && (r.headers.get('content-type') || '').includes('image/png'));
r = await call('GET', '/definitely-not-a-page');
check('Unknown page returns branded 404', r.status === 404 && r.text.includes('This page doesn'));
r = await call('GET', '/admin');
check('/admin is marked noindex', r.text.includes('noindex'));

// 18. Rate limits (last, because they lock this client out for a while)
let lastLookup = 0;
// A distinct proxy-added address keeps these limits away from the other suites. The first (client-supplied)
// entry changes on every request to prove it cannot be used to dodge the limit.
for (let i = 0; i < 12; i++) {
  lastLookup = (await call('POST', '/api/access/lookup', { email: 'x@example.com', paymentId: 'pay_x' }, { 'X-Forwarded-For': `1.1.1.${i}, 10.20.30.40` })).status;
}
check('Find my pass is rate-limited, and a spoofed client IP does not bypass it', lastLookup === 429, `last status=${lastLookup}`);
cookie = '';
let lastLogin = 0;
for (let i = 0; i < 11; i++) lastLogin = (await call('POST', '/api/admin/login', { password: 'wrong' }, { 'X-Forwarded-For': `2.2.2.${i}, 10.20.30.41` })).status;
check('Admin login is rate-limited after repeated failures', lastLogin === 429, `last status=${lastLogin}`);

const failed = results.filter((x) => !x.ok);
for (const x of results) console.log(`${x.ok ? 'PASS' : 'FAIL'}  ${x.name}${x.detail ? `  (${x.detail})` : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
