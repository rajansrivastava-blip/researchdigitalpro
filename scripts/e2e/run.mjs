// End-to-end test runner.
// Starts a mock Razorpay API and a production Next.js server on a throwaway data folder,
// runs every *-e2e.mjs suite, then shuts everything down.
// Never touches ./data or the real Razorpay keys in .env.local.
//
// Usage:  npm run build && npm run test:e2e
// Env:    CHROME_PATH  path to Chrome/Edge for the browser suites (auto-detected on common paths)
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const APP_PORT = 3110;
const MOCK_PORT = 3199;
const BASE = `http://localhost:${APP_PORT}`;

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rdp-e2e-'));
const outDir = path.join(root, 'scripts', 'e2e', 'output');
fs.mkdirSync(outDir, { recursive: true });

const browserCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const chromePath = browserCandidates.find((p) => fs.existsSync(p));

const env = {
  ...process.env,
  NODE_ENV: 'production',
  PORT: String(APP_PORT),
  DATA_DIR: dataDir,
  RAZORPAY_KEY_ID: 'rzp_test_E2EKEY',
  RAZORPAY_KEY_SECRET: 'e2e_test_secret',
  RAZORPAY_WEBHOOK_SECRET: 'e2e_webhook_secret',
  RAZORPAY_API_BASE: `http://localhost:${MOCK_PORT}/v1`,
  MASTER_DRIVE_LINK: 'https://drive.google.com/drive/folders/E2E_TEST_FOLDER',
  ADMIN_PASSWORD: 'e2e-admin-pw',
  ALLOW_SANDBOX_PAYMENTS: 'false',
  SITE_URL: BASE,
  MOCK_PORT: String(MOCK_PORT),
  E2E_BASE_URL: BASE,
  E2E_DATA_DIR: dataDir,
  E2E_OUT_DIR: outDir,
  E2E_ADMIN_PASSWORD: 'e2e-admin-pw',
  CHROME_PATH: chromePath || '',
};

const children = [];
function start(cmd, args, name) {
  const child = spawn(cmd, args, { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', (d) => process.env.E2E_VERBOSE && process.stdout.write(`[${name}] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[${name}] ${d}`));
  children.push(child);
  return child;
}

async function waitFor(url, timeoutMs = 60_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function runSuite(file) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(here, file)], { cwd: root, env, stdio: 'inherit' });
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

function cleanup() {
  for (const c of children) c.kill();
  fs.rmSync(dataDir, { recursive: true, force: true });
}
process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});

let failed = 0;
try {
  if (!fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) throw new Error('No production build found. Run `npm run build` first.');
  start(process.execPath, [path.join(here, 'mock-razorpay.mjs')], 'mock');
  start(process.execPath, [path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-p', String(APP_PORT)], 'next');
  await waitFor(`http://localhost:${MOCK_PORT}/`);
  await waitFor(`${BASE}/api/products`);

  const suites = fs.readdirSync(here).filter((f) => f.endsWith('-e2e.mjs')).sort();
  for (const suite of suites) {
    const needsBrowser = suite.startsWith('ui') || suite.startsWith('responsive');
    console.log(`\n━━ ${suite} ━━`);
    if (needsBrowser && !chromePath) {
      console.log('SKIPPED: no Chrome/Edge found. Set CHROME_PATH to run browser suites.');
      failed++;
      continue;
    }
    if ((await runSuite(suite)) !== 0) failed++;
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  failed++;
} finally {
  cleanup();
}

console.log(failed ? `\n${failed} suite(s) failed or skipped.` : '\nAll e2e suites passed.');
process.exit(failed ? 1 : 0);
