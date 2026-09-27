'use client';

import Link from 'next/link';
import { ArrowDown, Clock, CreditCard, Lock } from 'lucide-react';
import { US_PRODUCT_ID, getPriceSummary, getProductById } from '@/data/products';
import { useAppUI } from './AppProviders';

export function Hero() {
  const { storeInfo } = useAppUI();
  const prices = getPriceSummary();
  const us = getProductById(US_PRODUCT_ID);

  const scrollToCatalog = () => {
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  const tiles = [
    { label: 'Single datasets', price: `from ₹${prices.standardFrom}`, note: 'Global, e-commerce, real estate, startups, agencies', tone: 'text-emerald-300' },
    { label: 'USA database', price: `₹${prices.us}`, note: us ? `${us.recordCount}, all 50 states` : 'All 50 states', tone: 'text-blue-300' },
    { label: 'Complete bundle', price: `₹${prices.bundle}`, note: 'Every dataset in a single purchase', tone: 'text-amber-300' },
  ];

  const points = [
    {
      Icon: Lock,
      tone: 'text-blue-400',
      title: 'Files stay private until you pay',
      text: 'The storage link is released only through your personal download link, after Razorpay confirms the payment.',
    },
    {
      Icon: Clock,
      tone: 'text-amber-400',
      title: `Link valid for ${storeInfo.tokenExpiryHours} hours`,
      text: `Each pass allows up to ${storeInfo.maxDownloadsPerToken} downloads. Expired links are re-issued free on request.`,
    },
    {
      Icon: CreditCard,
      tone: 'text-emerald-400',
      title: 'Pay the way you prefer',
      text: "UPI, cards, net banking and wallets, all through Razorpay's secure checkout.",
    },
  ];

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden pt-12 pb-16 border-b border-slate-800/80 bg-slate-950">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-size-[4rem_4rem] pointer-events-none"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="inline-flex items-center gap-2 text-xs font-mono text-emerald-300 bg-emerald-950/70 ring-1 ring-emerald-800/80 px-3.5 py-1.5 rounded-lg font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
          Catalog updated {us?.lastUpdated ?? 'recently'}
        </p>

        <h1
          id="hero-title"
          className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-[1.1] text-balance"
        >
          Business and consumer contact data, <span className="text-blue-400">ready to download</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed text-pretty">
          CSV and XLSX datasets covering US businesses, global executives, e-commerce brands, real estate, startups and
          marketing agencies. Pay with Razorpay and get a private download link the moment your payment is confirmed.
        </p>

        <ul className="mt-8 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          {tiles.map((t) => (
            <li key={t.label} className="p-4 rounded-xl bg-slate-900/90 ring-1 ring-slate-800">
              <span className={`text-xs font-mono uppercase tracking-wider font-semibold ${t.tone}`}>{t.label}</span>
              <span className="block mt-1 text-2xl font-extrabold text-white">{t.price}</span>
              <span className="block mt-0.5 text-xs text-slate-400">{t.note}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={scrollToCatalog}
            className="px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-98"
          >
            Browse datasets
            <ArrowDown className="w-4 h-4" aria-hidden="true" />
          </button>
          <Link
            href="/access"
            className="px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 ring-1 ring-slate-700 font-semibold text-sm transition-colors"
          >
            Find my download
          </Link>
        </div>

        <ul className="mt-12 pt-8 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
          {points.map(({ Icon, tone, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${tone}`} aria-hidden="true" />
              <div>
                <span className="font-semibold text-slate-100 block mb-0.5 text-sm">{title}</span>
                <span className="text-slate-400 text-sm leading-relaxed">{text}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
