import React from 'react';
import { ShieldCheck, FileSpreadsheet, Lock, ArrowRight, Eye } from 'lucide-react';
import type { Product } from '@/types';
import { ModalShell } from './ui/ModalShell';

interface SampleDataModalProps {
  product: Product | null;
  onClose: () => void;
  onBuyNow: (product: Product) => void;
}

/** Renders masked segments ("***") as small locked chips so previews read as redacted, not broken. */
function MaskedValue({ value }: { value: string }) {
  const parts = value.split(/(\*+)/);
  return (
    <>
      {parts.map((part, i) =>
        /^\*+$/.test(part) ? (
          <span
            key={i}
            title="Revealed after purchase"
            className="inline-flex items-center gap-0.5 align-middle mx-0.5 px-1 py-px rounded bg-slate-800 ring-1 ring-slate-700 text-slate-400 text-[11px]"
          >
            <Lock className="w-2.5 h-2.5" />
            {'•'.repeat(Math.min(part.length, 4))}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export const SampleDataModal: React.FC<SampleDataModalProps> = ({ product, onClose, onBuyNow }) => {
  if (!product) return null;
  const isUs = product.id === 'us-data';

  return (
    <ModalShell
      onClose={onClose}
      closeLabel="Close sample preview"
      accent={isUs ? 'blue' : 'emerald'}
      size="xl"
      icon={<FileSpreadsheet className="w-5 h-5" />}
      eyebrow="Sample preview"
      title={product.title}
      subtitle={
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono ring-1 ${
              isUs ? 'bg-blue-500/10 text-blue-300 ring-blue-400/30' : 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30'
            }`}
          >
            {isUs ? 'US numbers (+1)' : 'Indian numbers (+91)'}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/30">
            ⚡ 2026 fresh update
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-white/5 text-slate-400 ring-1 ring-white/10">
            {product.recordCount}
          </span>
        </div>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tracking-tight">₹{product.price}</span>
            <span className="text-xs text-slate-400">INR one-time</span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">₹{product.originalPrice}</span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white rounded-xl ring-1 ring-slate-700 hover:bg-white/5 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onBuyNow(product);
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-white rounded-xl bg-linear-to-r from-blue-600 to-indigo-500 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              Buy full file · ₹{product.price}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <p className="text-xs text-slate-400 leading-relaxed">
          {isUs
            ? 'Sample rows of US business contacts with (+1) phone numbers. The purchased file contains every field in full.'
            : 'Sample rows of contacts with Indian (+91) phone numbers. The purchased file contains every field in full.'}
        </p>

        {/* Spreadsheet-style preview */}
        <div className="rounded-2xl ring-1 ring-slate-800 overflow-hidden bg-slate-900/40">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <span className="text-[11px] font-mono text-slate-400 truncate">
              {product.id}.{product.fileFormat.toLowerCase().includes('xlsx') ? 'xlsx' : 'csv'} — preview ({product.sampleRows.length}{' '}
              of {product.recordCount})
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Eye className="w-3 h-3" /> read-only
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-2.5 pl-4 pr-2 w-8 font-mono text-[11px] text-slate-500">#</th>
                  {product.sampleColumns.map((col) => (
                    <th key={col} className="py-2.5 px-4 whitespace-nowrap font-medium text-[11px] uppercase tracking-wide">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {product.sampleRows.map((row, rIdx) => (
                  <tr key={rIdx} className="odd:bg-white/2 hover:bg-blue-500/5 transition-colors">
                    <td className="py-3 pl-4 pr-2 font-mono text-[11px] text-slate-500">{rIdx + 1}</td>
                    {product.sampleColumns.map((col) => {
                      const val = row[col] || '—';
                      const lower = col.toLowerCase();
                      const isPhoneCol = lower.includes('phone') || lower.includes('contact number') || lower.includes('mobile');
                      const isUsPhone = val.startsWith('+1');
                      const isIndianPhone = val.startsWith('+91');
                      return (
                        <td key={col} className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                          {isPhoneCol && (isUsPhone || isIndianPhone) && (
                            <span
                              className={`mr-1.5 align-middle px-1 py-px rounded text-[11px] font-bold ring-1 ${
                                isUsPhone ? 'bg-blue-500/10 text-blue-300 ring-blue-400/30' : 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30'
                              }`}
                            >
                              {isUsPhone ? 'US' : 'IN'}
                            </span>
                          )}
                          <MaskedValue value={val} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Fade-out row hints at the rest of the file */}
                <tr aria-hidden="true">
                  <td colSpan={product.sampleColumns.length + 1} className="relative h-12">
                    <div className="absolute inset-0 bg-linear-to-b from-transparent to-slate-950 flex items-end justify-center pb-2">
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Full dataset ({product.recordCount}) unlocks after purchase
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Assurances */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {[
            {
              Icon: Lock,
              tone: 'text-amber-300 bg-amber-500/10 ring-amber-400/30',
              title: 'Masked previews',
              text: 'Emails and phone digits are hidden here to protect privacy before purchase.',
            },
            {
              Icon: ShieldCheck,
              tone: 'text-emerald-300 bg-emerald-500/10 ring-emerald-400/30',
              title: 'Full fields in your file',
              text: 'The file you buy contains every column shown here, without masking.',
            },
            {
              Icon: FileSpreadsheet,
              tone: 'text-blue-300 bg-blue-500/10 ring-blue-400/30',
              title: 'Time-limited link',
              text: 'Your download link appears on screen as soon as payment is confirmed.',
            },
          ].map(({ Icon, tone, title, text }) => (
            <div key={title} className="p-3.5 rounded-2xl bg-slate-900/50 ring-1 ring-slate-800 flex items-start gap-3">
              <span className={`w-8 h-8 rounded-xl ring-1 flex items-center justify-center shrink-0 ${tone}`}>
                <Icon className="w-4 h-4" />
              </span>
              <div>
                <span className="font-semibold text-slate-200 block mb-0.5">{title}</span>
                <span className="text-slate-400 text-[11px] leading-relaxed">{text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
};
