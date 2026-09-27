import React from 'react';
import { X, ShieldCheck, FileSpreadsheet, Lock } from 'lucide-react';
import { Product } from '../types.ts';

interface SampleDataModalProps {
  product: Product | null;
  onClose: () => void;
  onBuyNow: (product: Product) => void;
}

export const SampleDataModal: React.FC<SampleDataModalProps> = ({ product, onClose, onBuyNow }) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-start justify-between bg-slate-900/90">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium mb-1.5">
              <span className="flex items-center gap-1.5 text-blue-400">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Verified Sample Preview
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Sensitive Digits Masked</span>
              <span className="text-slate-600">·</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                  product.id === 'us-data'
                    ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                }`}
              >
                {product.id === 'us-data' ? '🇺🇸 US Numbers (+1)' : '🇮🇳 Indian Numbers (+91)'}
              </span>
              <span className="text-slate-600">·</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                ⚡ 2026 Fresh Update
              </span>
            </div>
            <h3 className="text-xl font-semibold text-white tracking-tight">{product.title}</h3>
            <p className="text-xs text-slate-400 mt-1">
              {product.id === 'us-data'
                ? 'Sample preview showing verified US business contacts with (+1) phone numbers. Unmasked records delivered immediately upon purchase.'
                : 'Sample preview showing verified contacts with Indian (+91) phone numbers. Unmasked records delivered immediately upon purchase.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close sample preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Sample Table */}
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-800/60 text-slate-300 border-b border-slate-800 font-medium">
                    {product.sampleColumns.map((col, idx) => (
                      <th key={idx} className="py-3 px-4 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {product.sampleRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                      {product.sampleColumns.map((col, cIdx) => {
                        const val = row[col] || '—';
                        const isPhoneCol =
                          col.toLowerCase().includes('phone') ||
                          col.toLowerCase().includes('contact') ||
                          col.toLowerCase().includes('mobile');
                        const isUsPhone = typeof val === 'string' && val.startsWith('+1');
                        const isIndianPhone = typeof val === 'string' && val.startsWith('+91');

                        return (
                          <td key={cIdx} className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-200">
                            {isPhoneCol && (isUsPhone || isIndianPhone) ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                                    isUsPhone
                                      ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                                  }`}
                                >
                                  {isUsPhone ? '🇺🇸 +1' : '🇮🇳 +91'}
                                </span>
                                <span className="text-slate-200">{val}</span>
                              </span>
                            ) : (
                              val
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Privacy & Integrity Disclaimer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-start gap-3">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-slate-200 block mb-0.5">Masked Previews</span>
                <span className="text-slate-400">Emails and phone numbers are masked here to protect privacy before purchase.</span>
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-slate-200 block mb-0.5">100% Unmasked on Delivery</span>
                <span className="text-slate-400">Your purchased CSV/XLSX file contains full, clear, unmasked raw records.</span>
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-start gap-3">
              <FileSpreadsheet className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-slate-200 block mb-0.5">Time-Limited Link</span>
                <span className="text-slate-400">Access link dispatched via email and screen immediately after payment.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">₹{product.price}</span>
            <span className="text-xs text-slate-400">INR one-time payment</span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-slate-500 line-through">₹{product.originalPrice}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onBuyNow(product);
              }}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-blue-400 hover:bg-blue-300 rounded-lg shadow-sm transition-all transform active:scale-95"
            >
              Proceed to Razorpay (₹{product.price})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
