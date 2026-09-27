import React from 'react';
import { Eye, ShieldCheck, Download, Check, Sparkles, Database } from 'lucide-react';
import { Product } from '../types.ts';

interface ProductCardProps {
  product: Product;
  onPreview: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPreview, onBuyNow }) => {
  const isSpecialUsPrice = product.id === 'us-data';

  return (
    <div
      className={`relative rounded-xl bg-slate-900 border transition-all flex flex-col justify-between ${
        isSpecialUsPrice
          ? 'border-blue-500/50 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20'
          : 'border-slate-800 hover:border-slate-700/80'
      }`}
    >
      {/* Top Section */}
      <div className="p-6 pb-4">
        {/* Category & Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            {product.category}
          </span>
          {product.badge && (
            <span
              className={`text-[11px] font-semibold tracking-wide ${
                isSpecialUsPrice ? 'text-blue-400 font-mono' : 'text-emerald-400 font-mono'
              }`}
            >
              ★ {product.badge}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white tracking-tight leading-snug mb-1.5 group-hover:text-blue-400 transition-colors">
          {product.title}
        </h3>

        {/* 2026 Fresh Data Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
            ⚡ 2026 Updated Records
          </span>
          <span className="text-[10px] text-slate-500 font-mono">100% Unmasked on delivery</span>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
          {product.description}
        </p>

        {/* Unboxed Metadata Strip (Zero-Pill Discipline) */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400 pb-4 mb-4 border-b border-slate-800/80 font-mono text-[11px]">
          <span className="text-slate-200 font-medium">{product.recordCount}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{product.fileFormat}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{product.fileSize}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-slate-500">Updated {product.lastUpdated}</span>
        </div>

        {/* Key Highlights */}
        <ul className="space-y-2 mb-4">
          {(product.highlights || []).slice(0, 3).map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom Pricing & Action Section */}
      <div className="p-6 pt-0">
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between mb-4">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white tracking-tight">₹{product.price}</span>
              <span className="text-xs font-mono text-slate-400">INR</span>
              {typeof product.originalPrice === 'number' && product.originalPrice > product.price && (
                <span className="text-xs text-slate-500 line-through ml-1">₹{product.originalPrice}</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">Instant 24h delivery link</span>
          </div>

          <button
            onClick={() => onPreview(product)}
            className="px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-800/60 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
            aria-label={`Preview sample data for ${product.title}`}
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Sample Preview</span>
          </button>
        </div>

        <button
          onClick={() => onBuyNow(product)}
          className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2 transform active:scale-98 ${
            isSpecialUsPrice
              ? 'bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold shadow-blue-500/20 shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-900'
          }`}
        >
          <span>Buy Now for ₹{product.price} INR</span>
        </button>
      </div>
    </div>
  );
};
