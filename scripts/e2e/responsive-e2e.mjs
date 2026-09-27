// Responsive + console audit: every page (and the main modals) at 9 widths.
// Fails on horizontal scrolling, JavaScript errors, failed requests or broken images.
import puppeteer from 'puppeteer-core';

const B = process.env.E2E_BASE_URL || 'http://localhost:3110';
const OUT = process.env.E2E_OUT_DIR;
const WIDTHS = [320, 375, 390, 414, 768, 1024, 1280, 1440, 1920];
const SHOT_WIDTHS = new Set([320, 390, 768, 1440]);
const PAGES = ['/', '/access', '/access?token=doesnotexist', '/terms', '/privacy', '/refund-policy', '/contact', '/admin', '/no-such-page'];
const results = [];
const check = (name, cond, detail = '') => results.push({ ok: !!cond, name, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: true });

async function audit(p) {
  return p.evaluate(() => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - window.innerWidth;
    const offenders = [];
    if (overflow > 1) {
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.right > window.innerWidth + 1 && getComputedStyle(el).position !== 'fixed') {
          offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 3).join('.')}`);
          if (offenders.length >= 3) break;
        }
      }
    }
    const brokenImages = [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src);
    const h1s = document.querySelectorAll('h1').length;
    return { overflow, offenders, brokenImages, h1s };
  });
}

for (const width of WIDTHS) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: width < 768 ? 800 : 900, isMobile: width < 768, hasTouch: width < 768 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // HTTP errors are checked precisely by the response listener below; the browser's generic
  // "Failed to load resource" console line would only duplicate them.
  page.on('console', (m) => m.type() === 'error' && !m.text().startsWith('Failed to load resource') && errors.push(`console: ${m.text()}`));
  await page.setRequestInterception(true);
  page.on('request', (req) =>
    req.url().startsWith('https://checkout.razorpay.com')
      ? req.respond({ status: 200, contentType: 'text/javascript', body: '/* Razorpay stub for layout tests */' })
      : req.continue()
  );
  page.on('requestfailed', (r) => {
    // Next.js cancels in-flight link prefetches (?_rsc=) when the page navigates. That is normal, not a failure.
    if (r.failure()?.errorText === 'net::ERR_ABORTED' && r.url().includes('_rsc=')) return;
    errors.push(`failed: ${r.failure()?.errorText} ${r.url()}`);
  });
  page.on('response', (r) => {
    const expected404 = r.url().includes('/no-such-page') || r.url().includes('doesnotexist');
    if (r.status() >= 400 && !expected404) errors.push(`${r.status()} ${r.url()}`);
  });

  let layoutProblems = [];
  let headingProblems = [];
  for (const path of PAGES) {
    await page.goto(B + path, { waitUntil: 'networkidle0' });
    const a = await audit(page);
    if (a.overflow > 1) layoutProblems.push(`${path} +${a.overflow}px (${a.offenders.join(', ')})`);
    if (a.brokenImages.length) layoutProblems.push(`${path} broken images`);
    if (a.h1s !== 1) headingProblems.push(`${path} has ${a.h1s} h1`);
    if (SHOT_WIDTHS.has(width) && OUT && ['/', '/access', '/terms'].includes(path)) {
      await page.screenshot({ path: `${OUT}/w${width}${path === '/' ? '-home' : path.replace(/[/?=]/g, '-')}.png`, fullPage: path === '/' });
    }
  }

  // Modals at this width
  await page.goto(B, { waitUntil: 'networkidle0' });
  for (const [label, button] of [
    ['checkout', 'Buy now · ₹79'],
    ['sample', 'Preview'],
  ]) {
    await page.evaluate((t) => [...document.querySelectorAll('button')].find((b) => b.textContent.includes(t))?.click(), button);
    await sleep(500);
    const a = await page.evaluate(() => {
      const d = document.querySelector('[role=dialog]');
      if (!d) return { open: false };
      const r = d.getBoundingClientRect();
      return { open: true, fits: r.left >= -1 && r.right <= window.innerWidth + 1, bottom: r.bottom <= window.innerHeight + 1 };
    });
    if (!a.open) layoutProblems.push(`${label} modal did not open`);
    else if (!a.fits || !a.bottom) layoutProblems.push(`${label} modal outside viewport`);
    if (SHOT_WIDTHS.has(width) && OUT) await page.screenshot({ path: `${OUT}/w${width}-modal-${label}.png` });
    await page.keyboard.press('Escape');
    await sleep(300);
  }

  check(`${width}px: no horizontal scroll, modals fit`, layoutProblems.length === 0, layoutProblems.join(' | '));
  check(`${width}px: exactly one h1 per page`, headingProblems.length === 0, headingProblems.join(' | '));
  check(`${width}px: no console errors or failed requests`, errors.length === 0, [...new Set(errors)].slice(0, 5).join(' | '));
  await page.close();
}

// Performance: what the home page actually downloads on a cold load.
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const requests = [];
  page.on('response', async (res) => {
    const type = res.request().resourceType();
    let bytes = 0;
    try {
      bytes = (await res.buffer()).length;
    } catch {}
    requests.push({ url: res.url(), type, bytes });
  });
  await page.goto(B, { waitUntil: 'networkidle0' });
  await sleep(500);
  const origin = new URL(B).origin;
  const thirdParty = requests.filter((r) => !r.url.startsWith(origin) && !r.url.startsWith('data:'));
  const jsBytes = requests.filter((r) => r.type === 'script').reduce((s, r) => s + r.bytes, 0);
  const cssBytes = requests.filter((r) => r.type === 'stylesheet').reduce((s, r) => s + r.bytes, 0);
  check('Home page makes no third-party requests (Razorpay loads only at checkout)', thirdParty.length === 0, thirdParty.map((r) => r.url).join(' | '));
  console.log(`METRIC home: ${requests.length} requests, JS ${(jsBytes / 1024).toFixed(0)} KB, CSS ${(cssBytes / 1024).toFixed(0)} KB (uncompressed)`);
  await page.close();
}

for (const x of results) console.log(`${x.ok ? 'PASS' : 'FAIL'}  ${x.name}${x.detail ? `  (${x.detail})` : ''}`);
const failed = results.filter((x) => !x.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
await browser.close();
process.exit(failed ? 1 : 0);
