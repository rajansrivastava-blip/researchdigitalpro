import Link from 'next/link';
import { getPriceSummary } from '@/data/products';
import { BRAND_NAME } from '@/lib/constants';

const linkClass = 'text-slate-300 hover:text-white transition-colors';

export function Footer({ supportEmail }: { supportEmail: string }) {
  const prices = getPriceSummary();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-sm py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <span className="font-bold text-white block">{BRAND_NAME}</span>
            <p className="leading-relaxed">
              Contact datasets delivered as CSV/XLSX files, paid for through Razorpay and downloaded through a private,
              time-limited link.
            </p>
            <p className="text-xs">
              From ₹{prices.standardFrom} · US data ₹{prices.us} · Complete bundle ₹{prices.bundle}
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold text-white">How delivery works</h2>
            <ul className="space-y-1.5">
              <li>Pay securely with Razorpay</li>
              <li>Get your private download link on screen</li>
              <li>Download within the link&apos;s time and download limit</li>
              <li>Lost it? Recover it with your email and payment ID</li>
            </ul>
          </div>

          <nav aria-label="Footer" className="space-y-3">
            <h2 className="font-semibold text-white">Links</h2>
            <ul className="space-y-1.5">
              <li>
                <Link href="/#catalog" className={linkClass}>
                  Browse datasets
                </Link>
              </li>
              <li>
                <Link href="/access" className={linkClass}>
                  Find my download pass
                </Link>
              </li>
              <li>
                <Link href="/terms" className={linkClass}>
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={linkClass}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className={linkClass}>
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact us
                </Link>
              </li>
            </ul>
          </nav>

          <div className="space-y-3">
            <h2 className="font-semibold text-white">Support</h2>
            <p>Missing or expired link? We resolve delivery problems within 24 hours of your email.</p>
            <a
              href={`mailto:${supportEmail}`}
              className="inline-block px-3 py-2 rounded-lg bg-slate-900 ring-1 ring-slate-800 text-blue-300 hover:text-blue-200 font-mono text-xs wrap-anywhere"
            >
              {supportEmail}
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>
            © {year} {BRAND_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span>Payments by Razorpay</span>
            <Link href="/admin" className="text-slate-400 hover:text-slate-200">
              Store owner login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
