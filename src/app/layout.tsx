import type { Metadata, Viewport } from 'next';
import { AppProviders } from '@/components/AppProviders';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { getPriceSummary } from '@/data/products';
import { BRAND_NAME, SITE_DESCRIPTION, SITE_URL } from '@/lib/constants';
import { getStoreInfo } from '@/lib/server/catalog';
import { loadConfig } from '@/lib/server/storage';
import './globals.css';

const DEFAULT_TITLE = `${BRAND_NAME} · B2B & Consumer Contact Datasets`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s · ${BRAND_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: BRAND_NAME,
  openGraph: {
    type: 'website',
    siteName: BRAND_NAME,
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    url: '/',
    locale: 'en_IN',
  },
  twitter: { card: 'summary_large_image', title: DEFAULT_TITLE, description: SITE_DESCRIPTION },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#020617',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const storeInfo = getStoreInfo(loadConfig());
  const prices = getPriceSummary();

  return (
    <html lang="en-IN">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-500/30 selection:text-white">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-blue-600 focus:text-white"
        >
          Skip to content
        </a>
        <AppProviders storeInfo={storeInfo}>
          {/* Pricing strip, derived from the catalog */}
          <div className="bg-slate-900 border-b border-slate-800 text-xs text-slate-300 py-1.5 px-4 text-center flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>
              Datasets from <strong className="text-white">₹{prices.standardFrom}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-600">
              •
            </span>
            <span>
              US database <strong className="text-white">₹{prices.us}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-600">
              •
            </span>
            <span>
              Complete bundle <strong className="text-white">₹{prices.bundle}</strong>
            </span>
            <span aria-hidden="true" className="hidden sm:inline text-slate-600">
              •
            </span>
            <span className="hidden sm:inline text-slate-400">Secure checkout by Razorpay</span>
          </div>

          <Navbar />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer supportEmail={storeInfo.supportEmail} />
        </AppProviders>
      </body>
    </html>
  );
}
