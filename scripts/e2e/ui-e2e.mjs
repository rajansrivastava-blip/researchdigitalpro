// Browser end-to-end test: real UI in Chrome/Edge. Razorpay's popup is replaced by a stub that
// returns a correctly signed payment, so the full flow runs without real money.
import crypto from 'crypto';
import puppeteer from 'puppeteer-core';

const B = process.env.E2E_BASE_URL || 'http://localhost:3110';
const SECRET = 'e2e_test_secret';
const OUT = process.env.E2E_OUT_DIR;
const results = [];
const check = (name, cond, detail = '') => results.push({ ok: !!cond, name, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 900 });
const pageErrors = [];
const failedRequests = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('console', (m) => m.type() === 'error' && !m.text().startsWith('Failed to load resource') && pageErrors.push(`console: ${m.text()}`));
// Only these error responses are expected (a deliberate wrong-payment-ID lookup). Anything else is a failure.
const EXPECTED_ERROR_RESPONSES = [['/api/access/lookup', 404]];
const unexpectedResponses = [];
page.on('response', (res) => {
  if (res.status() < 400) return;
  const ok = EXPECTED_ERROR_RESPONSES.some(([path, status]) => res.url().includes(path) && res.status() === status);
  if (!ok) unexpectedResponses.push(`${res.status()} ${res.url()}`);
});
page.on('requestfailed', (req) => {
  // Next.js cancels in-flight link prefetches (?_rsc=) when the page navigates. That is normal, not a failure.
  const abortedPrefetch = req.failure()?.errorText === 'net::ERR_ABORTED' && req.url().includes('_rsc=');
  if (!abortedPrefetch && !req.url().startsWith('https://checkout.razorpay.com')) failedRequests.push(`${req.failure()?.errorText} ${req.url()}`);
});

await page.setRequestInterception(true);
page.on('request', (req) => {
  // Razorpay's real script is replaced by the stub below.
  if (req.url().startsWith('https://checkout.razorpay.com')) return req.respond({ status: 200, contentType: 'text/javascript', body: '/* stub */' });
  req.continue();
});

await page.evaluateOnNewDocument(() => {
  window.__rzp = [];
  window.Razorpay = class {
    constructor(opts) {
      this.opts = opts;
      this.handlers = {};
      window.__rzp.push(this);
    }
    on(evt, fn) {
      this.handlers[evt] = fn;
    }
    open() {
      this.opened = true;
    }
  };
});

const clickText = (text, selector = 'button') =>
  page.evaluate(
    (text, selector) => {
      const el = [...document.querySelectorAll(selector)].find((b) => b.textContent.includes(text) && !b.disabled);
      el?.click();
      return !!el;
    },
    text,
    selector
  );
const bodyHas = (text) => page.evaluate((t) => document.body.innerText.toLowerCase().includes(t.toLowerCase()), text);
const dialogCount = () => page.evaluate(() => document.querySelectorAll('[role=dialog]').length);
const lastRzp = () =>
  page.evaluate(() => {
    const r = window.__rzp[window.__rzp.length - 1];
    return r ? { opened: r.opened, key: r.opts.key, amount: r.opts.amount, order_id: r.opts.order_id, name: r.opts.name, prefill: r.opts.prefill } : null;
  });

await page.goto(B, { waitUntil: 'networkidle0' });
check('Home page loads with the catalog', await bodyHas('Choose a dataset'));

// Catalog search + filter
await page.type('#catalog-search', 'shopify');
await sleep(200);
const visibleCards = await page.$$eval('#catalog article', (els) => els.length);
check('Catalog search filters the cards', visibleCards === 1, `cards=${visibleCards}`);
await page.$eval('#catalog-search', (el) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(el, '');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(200);
await clickText('Complete bundle');
await sleep(200);
const pressed = await page.$$eval('[aria-pressed="true"]', (els) => els.map((e) => e.textContent));
check('Category filter shows only the bundle and marks the tab pressed', (await page.$$eval('#catalog article', (e) => e.length)) === 1 && pressed.some((t) => t.includes('Complete bundle')));
await clickText('All datasets');
await sleep(200);

// Sample preview
await clickText('Preview');
await sleep(400);
check('Sample preview opens', await bodyHas('Sample preview'));
await page.keyboard.press('Escape');
await sleep(300);
check('Escape closes the modal', (await dialogCount()) === 0);

// Checkout
await clickText('Buy now · ₹79');
await sleep(500);
check('Checkout modal opens', await bodyHas('Secure Checkout'));

// Keyboard focus stays inside the modal
for (let i = 0; i < 25; i++) await page.keyboard.press('Tab');
const focusInside = await page.evaluate(() => !!document.activeElement?.closest('[role=dialog]'));
check('Tab key keeps focus inside the checkout dialog', focusInside);

await clickText('Pay ₹79 securely');
await sleep(300);
check('Empty form shows name error', await bodyHas('Please enter your full name.'));
await page.type('#checkout-name', 'UI Tester');
await page.type('#checkout-email', 'not-an-email');
await clickText('Pay ₹79 securely');
await sleep(300);
check('Invalid email shows an email error', await bodyHas('valid email address'));
await page.$eval('#checkout-email', (el) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(el, '');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.type('#checkout-email', 'ui.tester@example.com');
await page.type('#checkout-phone', '+91 98765 43210');
await clickText('Cards');

// Attempt 1: customer closes Razorpay
await clickText('Pay ₹79 securely');
await page.waitForFunction(() => window.__rzp.length === 1 && window.__rzp[0].opened, { timeout: 10000 });
let rzp = await lastRzp();
check('Razorpay popup opened with correct key, amount and brand', rzp.key === 'rzp_test_E2EKEY' && rzp.amount === 7900 && rzp.order_id?.startsWith('order_') && rzp.name === 'Research Digital Pro', `${rzp.key} ${rzp.amount} ${rzp.name}`);
check('Popup prefilled with name, email, phone and chosen method', rzp.prefill.name === 'UI Tester' && rzp.prefill.email === 'ui.tester@example.com' && rzp.prefill.contact === '9876543210' && rzp.prefill.method === 'card', JSON.stringify(rzp.prefill));
await page.evaluate(() => window.__rzp[0].opts.modal.ondismiss());
await sleep(300);
check('Closing the popup re-enables the Pay button', await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Pay ₹79 securely') && !b.disabled)));

// Attempt 2: bank declines
await clickText('Pay ₹79 securely');
await page.waitForFunction(() => window.__rzp.length === 2 && window.__rzp[1].opened, { timeout: 10000 });
await page.evaluate(() => window.__rzp[1].handlers['payment.failed']({ error: { code: 'GATEWAY_ERROR', description: 'Card declined by bank', reason: 'card_declined' } }));
await sleep(300);
check('Failed payment shows the error to the customer', await bodyHas('Payment failed: Card declined by bank'));

// Attempt 3: success
await clickText('Pay ₹79 securely');
await page.waitForFunction(() => window.__rzp.length === 3 && window.__rzp[2].opened, { timeout: 10000 });
rzp = await lastRzp();
const paymentId = `pay_UI${Date.now()}`;
const signature = crypto.createHmac('sha256', SECRET).update(`${rzp.order_id}|${paymentId}`).digest('hex');
await page.evaluate((resp) => window.__rzp[2].opts.handler(resp), { razorpay_payment_id: paymentId, razorpay_order_id: rzp.order_id, razorpay_signature: signature });
await page.waitForFunction(() => document.body.innerText.includes('Your download is ready'), { timeout: 10000 }).catch(() => {});
check('Success modal appears after verified payment', await bodyHas('Your download is ready'));
check('Success modal shows payment and order IDs', (await bodyHas(paymentId)) && (await bodyHas(rzp.order_id)));
check('Success modal tells the customer to save the link (no false email claim)', (await bodyHas('We do not email it')) && !(await bodyHas('sent by email')));
await sleep(1200);
if (OUT) await page.screenshot({ path: `${OUT}/ui-success.png` });

const accessUrl = await page.$eval('#access-link', (el) => el.value);
check('Access link points to /access?token=', /\/access\?token=[0-9a-f]{40}$/.test(accessUrl), accessUrl);
const token = accessUrl.split('token=')[1];

// Receipt
await clickText('View receipt');
await page.waitForFunction(() => document.body.innerText.includes('Your receipt'), { timeout: 5000 }).catch(() => {});
check('Receipt opens with the payment ID', (await bodyHas('Your receipt')) && (await bodyHas(paymentId)));
await page.keyboard.press('Escape');
await sleep(300);
check('Escape closes only the top modal (receipt), success stays open', (await dialogCount()) === 1);

// Download opens in a new tab so the success screen (and the link) stays visible
const newTarget = new Promise((resolve) => browser.once('targetcreated', resolve));
await clickText('Download now', 'a');
const target = await Promise.race([newTarget, sleep(5000).then(() => null)]);
check('Download opens in a new tab', !!target);
if (target) (await target.page())?.close().catch(() => {});
await sleep(1500);
const serverCount = await fetch(`${B}/api/access/${token}`).then((r) => r.json()).then((d) => d.downloadCount);
check('Server counted exactly one download', serverCount === 1, `downloadCount=${serverCount}`);
check('Success screen is still open after downloading', await bodyHas('Your download is ready'));

// Access portal
await page.goto(accessUrl, { waitUntil: 'networkidle0' });
check('Access page shows the pass as active', await bodyHas('Pass: Active'));
check('Access page counts the download (1 of 5)', await bodyHas('1 of 5'));
check('Access page shows 4 downloads left', await bodyHas('4 downloads left'));
if (OUT) await page.screenshot({ path: `${OUT}/ui-access.png` });

await page.reload({ waitUntil: 'networkidle0' });
check('Refreshing the access page keeps the pass', await bodyHas('Pass: Active'));

// Find my pass
await page.goto(`${B}/access`, { waitUntil: 'networkidle0' });
await page.type('#lookup-email', 'ui.tester@example.com');
await page.type('#lookup-payment', 'pay_wrong');
await clickText('Find pass');
await page.waitForFunction(() => document.body.innerText.includes('No pass matches'), { timeout: 5000 }).catch(() => {});
check('Find my pass shows an error for a wrong payment ID', await bodyHas('No pass matches'));
await page.$eval('#lookup-payment', (el) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(el, '');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.type('#lookup-payment', paymentId);
await clickText('Find pass');
await page.waitForFunction(() => location.search.includes('token='), { timeout: 10000 }).catch(() => {});
await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('pass: active'), { timeout: 10000 }).catch(() => {});
check('Find my pass opens the right pass', page.url().includes(token) && (await bodyHas('Pass: Active')));

await page.goBack({ waitUntil: 'networkidle0' });
check('Browser back returns to the empty lookup page', !page.url().includes('token=') && (await bodyHas('Find my pass')));
await page.goForward({ waitUntil: 'networkidle0' });
check('Browser forward returns to the pass', page.url().includes(token) && (await bodyHas('Pass: Active')));

// Legal pages from the footer
await page.goto(B, { waitUntil: 'networkidle0' });
await clickText('Refund Policy', 'footer a');
await page.waitForFunction(() => location.pathname === '/refund-policy', { timeout: 10000 }).catch(() => {});
check('Footer link opens the refund policy page', page.url().endsWith('/refund-policy') && (await bodyHas('When you get a full refund')));

check('No JavaScript errors in the browser', pageErrors.length === 0, pageErrors.join(' | '));
check('No failed network requests', failedRequests.length === 0, failedRequests.join(' | '));
check('No unexpected HTTP error responses', unexpectedResponses.length === 0, unexpectedResponses.join(' | '));

for (const x of results) console.log(`${x.ok ? 'PASS' : 'FAIL'}  ${x.name}${x.detail ? `  (${x.detail})` : ''}`);
const failed = results.filter((x) => !x.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
await browser.close();
process.exit(failed ? 1 : 0);
