import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { loadConfig } from '@/lib/server/storage';
import { LEGAL_LAST_UPDATED, type LegalFacts } from './LegalContent';

/** Reads the live store settings the legal text refers to (support email, link lifetime, download limit). */
export function getLegalFacts(): LegalFacts {
  const config = loadConfig();
  return {
    supportEmail: config.supportEmail,
    expiryHours: config.tokenExpiryHours,
    maxDownloads: config.maxDownloadsPerToken,
  };
}

const NAV = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/refund-policy', label: 'Refunds' },
  { href: '/contact', label: 'Contact' },
];

export function LegalPage({
  title,
  intro,
  current,
  children,
}: {
  title: string;
  intro: string;
  current: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to datasets
      </Link>

      <header className="mt-6 mb-8 space-y-2">
        <p className="text-xs font-mono uppercase tracking-[0.18em] text-blue-300">Legal &amp; support</p>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{title}</h1>
        <p className="text-slate-400">{intro}</p>
        {current !== '/contact' && <p className="text-xs text-slate-400">Last updated: {LEGAL_LAST_UPDATED}</p>}
      </header>

      <nav aria-label="Legal pages" className="mb-8 flex flex-wrap gap-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.href === current ? 'page' : undefined}
            className={`px-3.5 py-1.5 rounded-full text-sm ring-1 transition-colors ${
              item.href === current
                ? 'bg-blue-600 text-white ring-blue-500'
                : 'text-slate-300 ring-slate-700 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="rounded-3xl bg-slate-950 ring-1 ring-slate-800 p-5 sm:p-8">{children}</div>
    </div>
  );
}
