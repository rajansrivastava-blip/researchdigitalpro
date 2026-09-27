import React from 'react';
import { ShieldCheck, Clock, Download, ArrowDown, Lock, CheckCircle2, FileSpreadsheet } from 'lucide-react';

interface HeroProps {
  onScrollToCatalog: () => void;
  onOpenAccessPortal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onScrollToCatalog, onOpenAccessPortal }) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 border-b border-slate-800/80 bg-slate-950">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Clean Kicker & 2026 Data Banner */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>CRYPTOGRAPHICALLY PROTECTED DIGITAL DELIVERY</span>
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-300 bg-emerald-950/70 border border-emerald-800/80 px-3.5 py-1.5 rounded-lg font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>2026 FRESH UPDATED DATA INCLUDED IN ALL FILES</span>
          </div>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-[1.1]">
          Verified Business & Leads Vault with <span className="text-blue-400">Instant Razorpay Access</span>
        </h1>

        {/* Subhead */}
        <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          High-accuracy consumer and B2B directories with <strong className="text-slate-200">2026 fresh verified updates</strong>. Raw database links remain completely secured on the server and are only minted into time-limited 24-hour download links upon payment confirmation.
        </p>

        {/* User Pricing Notice */}
        <div className="mt-8 max-w-2xl mx-auto p-4 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
          <div className="pt-2 sm:pt-0 sm:pr-4">
            <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block font-semibold">Individual Files</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-extrabold text-white">₹49</span>
              <span className="text-xs text-slate-400 font-mono">INR</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Global, Shopify, Real Estate, Startups</span>
          </div>
          <div className="pt-2 sm:pt-0 sm:px-4">
            <span className="text-[11px] font-mono text-blue-400 uppercase tracking-wider block font-semibold">USA Master Data</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-extrabold text-blue-400">₹79</span>
              <span className="text-xs text-slate-400 font-mono">INR</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">1.25M+ 50-State Verified Contacts</span>
          </div>
          <div className="pt-2 sm:pt-0 sm:pl-4">
            <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block font-semibold">VIP Drive Bundle</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-extrabold text-amber-300">₹249</span>
              <span className="text-xs text-slate-400 font-mono">INR</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Full Google Drive Folder Access</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onScrollToCatalog}
            className="px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs shadow-lg shadow-blue-500/10 transition-all flex items-center gap-2 transform active:scale-98"
          >
            <span>Browse Products Catalog</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenAccessPortal}
            className="px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs transition-colors flex items-center gap-2"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Track Order / Access My Download</span>
          </button>
        </div>

        {/* Security Assurances (Unboxed, Zero-Pill) */}
        <div className="mt-12 pt-8 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-4xl mx-auto text-xs">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block mb-0.5">Database Hidden Until Payment</span>
              <span className="text-slate-400 text-[11px] leading-relaxed">
                Raw Google Drive paths are never sent to unverified clients. Download links are granted only upon Razorpay settlement.
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block mb-0.5">24h Time-Limited Expiration</span>
              <span className="text-slate-400 text-[11px] leading-relaxed">
                Tokens automatically self-terminate after 24 hours to prevent unauthorized link reselling and database leaks.
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block mb-0.5">Full Customer IP Tracking</span>
              <span className="text-slate-400 text-[11px] leading-relaxed">
                Every download activity is logged with IP and timestamp for fraud prevention and merchant protection.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
