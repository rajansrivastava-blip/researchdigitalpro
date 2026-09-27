'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Download, KeyRound, Loader2, ReceiptText, Search, ShieldCheck } from 'lucide-react';
import type { AccessDetails } from '@/types';
import { isValidEmail } from '@/lib/constants';
import { timeLeft, useNow } from '@/lib/useNow';
import { useAppUI } from './AppProviders';

interface AccessPortalProps {
  initialToken?: string;
  initialData: AccessDetails | null;
  initialError: string | null;
}

const STATUS_COPY: Record<AccessDetails['accessStatus'], { label: string; text: string; tone: string }> = {
  active: { label: 'Active', text: 'Your download link is ready to use.', tone: 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' },
  expired: {
    label: 'Expired',
    text: 'This link has expired. Email support and we will re-issue it for free.',
    tone: 'bg-amber-950/20 border-amber-800/40 text-amber-300',
  },
  limit_reached: {
    label: 'Download limit reached',
    text: 'All downloads on this pass have been used. Email support if you need more.',
    tone: 'bg-rose-950/20 border-rose-800/40 text-rose-300',
  },
  revoked: {
    label: 'Revoked',
    text: 'This pass has been cancelled. Contact support if you think this is a mistake.',
    tone: 'bg-rose-950/20 border-rose-800/40 text-rose-300',
  },
};

const inputClass =
  'w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

export const AccessPortal: React.FC<AccessPortalProps> = ({ initialToken = '', initialData, initialError }) => {
  const router = useRouter();
  const { openReceipt, storeInfo } = useAppUI();
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [accessData, setAccessData] = useState<AccessDetails | null>(initialData);
  const [error, setError] = useState<string | null>(initialError);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const left = timeLeft(accessData?.expiresAt, useNow());

  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupPaymentId, setLookupPaymentId] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
  }, []);

  const goToToken = (token: string) => {
    const t = token.trim();
    if (!t) {
      setError('Paste the access code from your download link.');
      return;
    }
    if (t === initialToken && accessData) {
      refreshAccess(t); // Same pass already open: just refresh it.
      return;
    }
    setIsNavigating(true);
    router.push(`/access?token=${encodeURIComponent(t)}`);
  };

  const refreshAccess = async (token: string) => {
    try {
      const res = await fetch(`/api/access/${encodeURIComponent(token)}`, { cache: 'no-store' });
      if (res.ok) setAccessData(await res.json());
    } catch {
      // Keep showing the last known state; the next reload will correct it.
    }
  };

  const handleDownload = () => {
    if (!accessData) return;
    setIsDownloading(true);
    refreshTimer.current = setTimeout(() => {
      setIsDownloading(false);
      refreshAccess(accessData.token);
    }, 2500);
  };

  const handleLookup = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValidEmail(lookupEmail)) {
      setLookupError('Enter the email address you used at checkout.');
      return;
    }
    if (!lookupPaymentId.trim()) {
      setLookupError('Enter your Razorpay payment ID. It starts with pay_ and appears in your Razorpay receipt.');
      return;
    }
    setIsLookingUp(true);
    setLookupError(null);
    try {
      const res = await fetch('/api/access/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lookupEmail, paymentId: lookupPaymentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) throw new Error(data.error || 'We could not find your pass. Please try again.');
      router.push(`/access?token=${encodeURIComponent(data.token)}`);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'We could not find your pass. Please try again.');
      setIsLookingUp(false);
    }
  };

  const status = accessData ? STATUS_COPY[accessData.accessStatus] : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-12 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to datasets
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 bg-slate-950/40">
          <h1 className="text-2xl font-bold text-white mb-1">Your download pass</h1>
          <p className="text-sm text-slate-400 mb-4">Open your access link, or paste the access code from it below.</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              goToToken(tokenInput);
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <label htmlFor="access-token" className="sr-only">
                Access code
              </label>
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="access-token"
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Access code, e.g. 9f4b…"
                autoComplete="off"
                spellCheck={false}
                className={`${inputClass} pl-10 font-mono`}
              />
            </div>
            <button
              type="submit"
              disabled={isNavigating}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 shrink-0 flex items-center justify-center gap-2"
            >
              {isNavigating && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {isNavigating ? 'Opening…' : 'Open pass'}
            </button>
          </form>
        </div>

        {error && (
          <div role="alert" className="p-6 border-b border-slate-800 bg-rose-950/20 text-sm text-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" aria-hidden="true" />
            <div>
              <span className="font-semibold block mb-0.5">Pass not found</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {accessData && status && (
          <div className="p-6 space-y-6">
            <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${status.tone}`}>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                <div>
                  <span className="font-bold text-sm uppercase tracking-wider block">Pass: {status.label}</span>
                  <span className="text-sm text-slate-300">{status.text}</span>
                </div>
              </div>
              {accessData.accessStatus === 'active' && (
                <div className="text-right font-mono" role="timer" aria-label="Time left on this link">
                  <span className="text-base font-bold text-emerald-300 tabular-nums">
                    {left
                      ? `${String(left.hours).padStart(2, '0')}:${String(left.minutes).padStart(2, '0')}:${String(left.seconds).padStart(2, '0')}`
                      : '--:--:--'}
                  </span>
                  <span className="text-xs text-slate-400 block">left</span>
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Dataset</span>
                  <h2 className="text-lg font-bold text-white mt-0.5">{accessData.productTitle}</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {accessData.fileFormat} · {accessData.fileSize} · Paid ₹{accessData.amount}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <span className="text-slate-400 block text-xs">Downloads used</span>
                  <span className="font-bold text-slate-100">
                    {accessData.downloadCount} of {accessData.maxDownloads}
                  </span>
                </div>
              </div>

              {accessData.accessStatus === 'active' ? (
                <a
                  href={`/api/download/${encodeURIComponent(accessData.token)}`}
                  target="_blank"
                  rel="noopener"
                  onClick={handleDownload}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-md"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Opening your files…
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" aria-hidden="true" />
                      Download dataset ({accessData.downloadsRemaining} {accessData.downloadsRemaining === 1 ? 'download' : 'downloads'}{' '}
                      left)
                    </>
                  )}
                </a>
              ) : (
                <a
                  href={`mailto:${accessData.supportEmail}?subject=${encodeURIComponent(`Re-issue download link – ${accessData.paymentId}`)}`}
                  className="w-full py-3 rounded-lg ring-1 ring-slate-700 hover:bg-white/5 text-slate-100 text-sm font-semibold flex items-center justify-center"
                >
                  Email {accessData.supportEmail} for a new link
                </a>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-400 pt-3 border-t border-slate-800/80">
                <span className="font-mono text-xs wrap-anywhere">Payment {accessData.paymentId}</span>
                <button
                  onClick={() => openReceipt(accessData.token)}
                  className="text-blue-300 hover:text-blue-200 font-medium inline-flex items-center gap-1.5"
                >
                  <ReceiptText className="w-4 h-4" aria-hidden="true" />
                  View receipt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recover a lost pass */}
      <section aria-labelledby="lookup-title" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <KeyRound className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 id="lookup-title" className="text-lg font-bold text-white">
              Find my pass
            </h2>
            <p className="text-sm text-slate-400">
              Lost your link? Enter the email you used at checkout and your Razorpay payment ID (it starts with{' '}
              <span className="font-mono text-slate-300">pay_</span> and is shown in Razorpay&apos;s payment receipt).
            </p>
          </div>
        </div>

        {lookupError && (
          <p role="alert" className="p-3 rounded-lg bg-rose-500/10 ring-1 ring-rose-500/30 text-rose-200 text-sm">
            {lookupError}
          </p>
        )}

        <form onSubmit={handleLookup} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end" noValidate>
          <div>
            <label htmlFor="lookup-email" className="block text-sm text-slate-300 mb-1.5">
              Checkout email
            </label>
            <input
              id="lookup-email"
              type="email"
              autoComplete="email"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              placeholder="name@example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="lookup-payment" className="block text-sm text-slate-300 mb-1.5">
              Payment ID
            </label>
            <input
              id="lookup-payment"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={lookupPaymentId}
              onChange={(e) => setLookupPaymentId(e.target.value)}
              placeholder="pay_XXXXXXXX"
              className={`${inputClass} font-mono`}
            />
          </div>
          <button
            type="submit"
            disabled={isLookingUp}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLookingUp && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {isLookingUp ? 'Searching…' : 'Find pass'}
          </button>
        </form>
        <p className="text-sm text-slate-400">
          Still stuck? Email{' '}
          <a href={`mailto:${storeInfo.supportEmail}`} className="text-blue-300 hover:text-blue-200 underline underline-offset-2">
            {storeInfo.supportEmail}
          </a>
          .
        </p>
      </section>
    </div>
  );
};
