'use client';

import React, { useEffect, useState } from 'react';
import { Bookmark, Check, CheckCircle2, Copy, Download, Link2, Loader2, ReceiptText, ShieldCheck } from 'lucide-react';
import type { PaymentResult } from '@/types';
import { useOrigin } from '@/lib/useOrigin';
import { timeLeft, useNow } from '@/lib/useNow';
import { CountdownTiles, ModalShell } from './ui/ModalShell';

interface SuccessReceiptModalProps {
  paymentResult: PaymentResult;
  supportEmail: string;
  onClose: () => void;
  onOpenReceipt: (token: string) => void;
}

export const SuccessReceiptModal: React.FC<SuccessReceiptModalProps> = ({ paymentResult, supportEmail, onClose, onOpenReceipt }) => {
  const origin = useOrigin();
  const accessPath = `/access?token=${encodeURIComponent(paymentResult.token)}`;
  const accessUrl = `${origin}${accessPath}`;
  const left = timeLeft(paymentResult.expiresAt, useNow()) ?? { hours: 0, minutes: 0, seconds: 0 };
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadCount, setDownloadCount] = useState(paymentResult.downloadCount || 0);

  // Celebration confetti, loaded only when a payment succeeds.
  useEffect(() => {
    let cancelled = false;
    import('canvas-confetti')
      .then(({ default: confetti }) => {
        if (!cancelled) confetti({ particleCount: 90, spread: 75, origin: { y: 0.55 }, colors: ['#34d399', '#60a5fa', '#a78bfa', '#fbbf24'] });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const directDownloadUrl = `/api/download/${encodeURIComponent(paymentResult.token)}`;
  const limitReached = downloadCount >= paymentResult.maxDownloads;

  const copyAccessLink = async () => {
    try {
      await navigator.clipboard.writeText(accessUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Clipboard can be blocked (e.g. non-HTTPS). The link stays visible in the input for manual copy.
    }
  };

  const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isDownloading || limitReached) {
      e.preventDefault();
      return;
    }
    setIsDownloading(true);
    setDownloadCount((prev) => prev + 1);
    setTimeout(() => setIsDownloading(false), 2000);
  };

  return (
    <ModalShell
      onClose={onClose}
      accent="emerald"
      size="md"
      eyebrow="Payment confirmed"
      title="Your download is ready"
      subtitle="Save your access link now. You will need it to download again later."
      icon={
        <span className="relative flex items-center justify-center">
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ring" />
          <CheckCircle2 className="relative w-6 h-6" />
        </span>
      }
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <span className="text-slate-400">
            Need help? <a href={`mailto:${supportEmail}`} className="font-mono text-blue-300 hover:text-blue-200">{supportEmail}</a>
          </span>
          <button onClick={onClose} className="px-5 py-2.5 font-semibold rounded-xl ring-1 ring-slate-700 hover:bg-white/5 text-slate-200 transition-colors">
            Done
          </button>
        </div>
      }
    >
      <div className="space-y-5 text-sm">
        {/* Pass "ticket" */}
        <div className="relative rounded-3xl p-px bg-linear-to-br from-emerald-400/60 via-teal-500/20 to-blue-500/50">
          <div className="relative rounded-[calc(1.5rem-1px)] bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 overflow-hidden">
            <div aria-hidden="true" className="pointer-events-none absolute -top-16 -left-10 w-40 h-40 rounded-full bg-emerald-500/15 blur-3xl" />

            <div className="relative p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-mono uppercase tracking-[0.18em] text-emerald-300">Download pass</span>
                  <h3 className="mt-1 font-bold text-white leading-snug">{paymentResult.productTitle}</h3>
                </div>
                <div className="shrink-0 text-right">
                  <span className="block text-xs font-mono text-slate-400">DOWNLOADS</span>
                  <span className="text-lg font-black text-white tabular-nums">
                    {downloadCount}
                    <span className="text-slate-400 text-xs font-medium"> / {paymentResult.maxDownloads}</span>
                  </span>
                </div>
              </div>

              <div className="flex gap-1" aria-hidden="true">
                {Array.from({ length: paymentResult.maxDownloads }).map((_, i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${i < downloadCount ? 'bg-emerald-400' : 'bg-slate-800'}`} />
                ))}
              </div>

              <a
                href={directDownloadUrl}
                target="_blank"
                rel="noopener"
                onClick={handleDownloadClick}
                aria-disabled={limitReached || undefined}
                className={`group relative overflow-hidden w-full py-3.5 px-4 rounded-2xl font-bold text-slate-950 bg-linear-to-r from-emerald-400 to-teal-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                  limitReached ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg] bg-white/40 blur-sm transition-transform duration-700 group-hover:translate-x-[300%]"
                />
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Opening your files…</span>
                  </>
                ) : limitReached ? (
                  <span>Download limit reached</span>
                ) : (
                  <>
                    <Download className="w-4 h-4" aria-hidden="true" />
                    <span>Download now</span>
                  </>
                )}
              </a>
            </div>

            <div className="relative flex items-center" aria-hidden="true">
              <span className="absolute -left-3 w-6 h-6 rounded-full bg-slate-950" />
              <span className="w-full border-t-2 border-dashed border-slate-800 mx-4" />
              <span className="absolute -right-3 w-6 h-6 rounded-full bg-slate-950" />
            </div>

            <div className="relative p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Link expires in</span>
                <CountdownTiles {...left} tone="amber" />
              </div>
              <dl className="text-right font-mono text-xs text-slate-400 space-y-0.5">
                <div>
                  <dt className="inline">ORDER </dt>
                  <dd className="inline text-slate-200 wrap-anywhere">{paymentResult.orderId}</dd>
                </div>
                <div>
                  <dt className="inline">PAYMENT </dt>
                  <dd className="inline text-slate-200 wrap-anywhere">{paymentResult.paymentId}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Save the link */}
        <div className="p-4 rounded-2xl bg-amber-500/5 ring-1 ring-amber-400/25 flex items-start gap-3">
          <Bookmark className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-slate-300">
            <span className="font-semibold text-white">Save this link.</span> We do not email it. If you lose it, use{' '}
            <span className="font-semibold text-white">Find my pass</span> with{' '}
            <span className="text-slate-100 wrap-anywhere">{paymentResult.recipientEmail}</span> and your payment ID.
          </p>
        </div>

        <div>
          <label htmlFor="access-link" className="flex items-center gap-1.5 text-sm font-medium text-slate-200 mb-1.5">
            <Link2 className="w-4 h-4 text-slate-400" aria-hidden="true" />
            Your access link
          </label>
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 ring-1 ring-slate-800">
            <input
              id="access-link"
              type="text"
              readOnly
              value={accessUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono bg-transparent text-slate-200 outline-none"
            />
            <button
              onClick={copyAccessLink}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                isCopied ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {isCopied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            Each download is counted against your limit.
          </p>
          <button
            onClick={() => onOpenReceipt(paymentResult.token)}
            className="px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 ring-1 ring-violet-400/30 text-violet-200 text-sm font-medium flex items-center gap-1.5"
          >
            <ReceiptText className="w-4 h-4" aria-hidden="true" />
            View receipt
          </button>
        </div>
      </div>
    </ModalShell>
  );
};
