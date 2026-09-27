# Research Digital Pro

Digital dataset store built with **Next.js 16 (App Router)** and **Tailwind CSS v4**. Customers pay with Razorpay and get a
private, time-limited, download-counted link to the files.

## Getting started

```bash
npm install
cp .env.example .env.local   # set ADMIN_PASSWORD (required), SITE_URL and Razorpay keys
npm run dev                  # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

## Scripts

| Command             | What it does                                                                      |
| ------------------- | --------------------------------------------------------------------------------- |
| `npm run lint`      | ESLint (Next.js core-web-vitals + TypeScript rules)                               |
| `npm run typecheck` | TypeScript, no emit                                                               |
| `npm run build`     | Production build                                                                  |
| `npm run test:e2e`  | End-to-end suites against the production build (run `npm run build` first)       |
| `npm run check`     | All of the above in order                                                         |

The e2e runner starts a **mock Razorpay API** and a production server on a throwaway data folder, so it never touches
`./data` or your real keys. Browser suites need Chrome or Edge (auto-detected, or set `CHROME_PATH`).
Screenshots are written to `scripts/e2e/output/`.

## Pages

| Route                                      | Purpose                                                        |
| ------------------------------------------ | -------------------------------------------------------------- |
| `/`                                        | Catalog, sample preview, checkout                              |
| `/access`                                  | Customer download pass (`/access?token=…`) and **Find my pass** |
| `/terms`, `/privacy`, `/refund-policy`, `/contact` | Legal and support pages (also required for Razorpay website approval) |
| `/admin`                                   | Password-protected merchant dashboard (`/admin?tab=settings`)  |

Old links of the form `/?token=…` redirect to `/access?token=…`.

## Payment flow

1. `POST /api/create-order` creates a Razorpay order whose notes carry the product and buyer.
2. Razorpay Checkout (loaded only when checkout opens) takes the payment.
3. The browser sends the signed result to `POST /api/verify-payment`. The server checks the signature, confirms the order
   matches the product and price, and issues the pass.
4. **Backup:** Razorpay also calls `POST /api/razorpay/webhook` (`order.paid`), so the pass is created even if the customer
   closed the tab. Both paths are idempotent per payment ID.
5. The customer downloads through `/api/download/[token]`, which enforces expiry and the download limit, logs the download
   and redirects to the hidden Drive link.

### Webhook setup (do this once after deploying)

Razorpay Dashboard → **Settings → Webhooks → Add new webhook**

- URL: `https://YOUR-DOMAIN/api/razorpay/webhook`
- Secret: any long random string. Put the same value in `RAZORPAY_WEBHOOK_SECRET`.
- Active event: **order.paid**

## Environment

See `.env.example` for every variable. Required in production: `ADMIN_PASSWORD`, `SITE_URL`, `RAZORPAY_KEY_ID`,
`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.

## Deploying on Hostinger (from GitHub)

Needs a Hostinger plan with **Node.js web apps** (Business or Cloud web hosting) or a **VPS**. The Premium/Single
shared plans only serve static sites and cannot run this app.

**Node.js web app (hPanel)**

1. hPanel → **Websites → Add website → Node.js app** → import from **GitHub**, authorise Hostinger, pick this repository and
   the branch to deploy.
2. Build settings: Node **20 or newer**, install `npm install`, build `npm run build`, start `npm start`.
3. Environment variables (same names as `.env.example`):
   `ADMIN_PASSWORD`, `SITE_URL` (your https domain), `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
   `MASTER_DRIVE_LINK`, `SUPPORT_EMAIL`, and **`DATA_DIR`** pointing to a folder **outside** the app folder
   (for example `/home/<your-user>/rdp-data`) so orders survive redeploys.
4. Deploy, then point your domain at the app and enable SSL in hPanel.
5. In Razorpay: add the webhook (see above) and list your domain under **Account & Settings → Website details**.

**VPS alternative:** install Node 20+, clone the repo, create `.env.local`, run `npm install && npm run build`, keep it running
with `pm2 start npm --name rdp -- start`, and put Nginx in front (it sets `X-Forwarded-For`) with a Let's Encrypt certificate.

## Hosting requirements

- **Persistent disk.** Orders and settings are JSON files in `data/` (git-ignored). Use a VPS, Render, Railway or a Docker
  volume. Serverless hosts such as Vercel lose these files; move storage to a database before deploying there.
- **Reverse proxy that sets `X-Forwarded-For`.** Rate limits use the address your proxy adds, so clients cannot fake it.
- **Single instance.** The rate limiter is in memory. Several instances would each keep their own counts.

## Project layout

```
src/app/                 pages, API route handlers (api/*/route.ts), robots, sitemap, icon, OG image
src/components/          React components ('use client' where interactive)
src/components/legal/    legal text shared by the pages and the checkout modals
src/components/ui/       ModalShell (dialog frame, focus trap), timeline and countdown pieces
src/data/products.ts     product catalog + price helpers (single source for all prices)
src/lib/server/          server-only code: storage, orders, Razorpay, admin auth, rate limit, HTTP helpers
scripts/e2e/             mock Razorpay, API, browser and responsive test suites
```
