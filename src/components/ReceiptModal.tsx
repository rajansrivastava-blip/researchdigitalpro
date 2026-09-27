'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Copy, Printer, ReceiptText } from 'lucide-react';
import type { AccessDetails } from '@/types';
import { BRAND_NAME } from '@/lib/constants';
import { useOrigin } from '@/lib/useOrigin';
import { ModalShell } from './ui/ModalShell';

const STATUS_LABEL: Record<AccessDetails['accessStatus'], string> = {
  active: 'Active',
  expired: 'Expired',
  limit_reached: 'Download limit reached',
  revoked: 'Revoked',
};

/** Printable purchase receipt with the customer's access link. Replaces the old simulated email preview. */
export function ReceiptModal({ details, onClose }: { details: AccessDetails; onClose: () => void }) {
  const origin = useOrigin();
  const [copied, setCopied] = useState(false);
  const accessPath = `/access?token=${encodeURIComponent(details.token)}`;
  const accessUrl = `${origin}${accessPath}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(accessUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (non-HTTPS). The link stays visible for manual copying.
    }
  };

  const rows: [string, string][] = [
    ['Dataset', details.productTitle],
    ['Format', `${details.fileFormat} · ${details.fileSize}`],
    ['Amount paid', `₹${details.amount} ${details.currency}`],
    ['Payment ID', details.paymentId],
    ['Order ID', details.orderId],
    ['Purchased', new Date(details.createdAt).toLocaleString()],
    ['Link valid until', new Date(details.expiresAt).toLocaleString()],
    ['Downloads', `${details.downloadCount} of ${details.maxDownloads} used`],
    ['Pass status', STATUS_LABEL[details.accessStatus]],
  ];

  return (
    <ModalShell
      onClose={onClose}
      closeLabel="Close receipt"
      accent="violet"
      size="md"
      icon={<ReceiptText className="w-5 h-5" />}
      eyebrow="Payment receipt"
      title="Your receipt"
      subtitle="Keep this for your records. It includes your personal access link."
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <Link href={accessPath} onClick={onClose} className="text-slate-300 hover:text-white underline underline-offset-2">
            Open download page
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl ring-1 ring-slate-700 hover:bg-white/5 text-slate-200 flex items-center justify-center gap-1.5 font-medium"
            >
              <Printer className="w-4 h-4" aria-hidden="true" />
              Print
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <div data-print-area className="rounded-2xl bg-white text-slate-900 shadow-xl shadow-black/40 overflow-hidden">
        <div className="h-1.5 bg-linear-to-r from-blue-600 via-violet-500 to-emerald-500" />
        <div className="p-5 sm:p-6 space-y-5 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <div className="font-bold text-base tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" aria-hidden="true" />
                {BRAND_NAME}
              </div>
              <div className="text-slate-600 text-xs mt-0.5">Support: {details.supportEmail}</div>
            </div>
            <div className="text-right text-xs text-slate-600">
              <div className="font-semibold text-slate-900">Receipt</div>
              <div className="font-mono wrap-anywhere">{details.orderId}</div>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-slate-600">Billed to</div>
            <div className="font-semibold">{details.customerName}</div>
            <div className="text-slate-700 wrap-anywhere">{details.customerEmail}</div>
          </div>

          <dl className="rounded-lg border border-slate-200 divide-y divide-slate-200">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-3.5 py-2">
                <dt className="text-slate-600 shrink-0">{k}</dt>
                <dd className="font-medium text-right wrap-anywhere">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="space-y-1.5">
            <div className="text-xs uppercase tracking-wider text-slate-600">Your access link</div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-1.5">
              <span className="flex-1 min-w-0 px-1.5 font-mono text-xs wrap-anywhere">{accessUrl}</span>
              <button
                onClick={copy}
                className="shrink-0 px-2.5 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium flex items-center gap-1 print:hidden"
              >
                {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Lost this link? Use <strong>Find my pass</strong> on the download pass page with your email and payment ID.
            </p>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
