import React from 'react';
import { Check, Eye } from 'lucide-react';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onPreview: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

// Every card looks the same at rest; the highlight follows the mouse (or keyboard focus).
export const ProductCard: React.FC<ProductCardProps> = ({ product, onPreview, onBuyNow }) => {
  const hasDiscount = product.originalPrice > product.price;

  return (
    <article className="group relative rounded-xl bg-slate-900 border border-slate-800 ring-1 ring-transparent flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-blue-500/60 hover:ring-blue-500/25 hover:shadow-xl hover:shadow-blue-500/15 focus-within:border-blue-500/60 focus-within:ring-blue-500/25 motion-reduce:hover:translate-y-0">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between gap-2 mb-3 min-h-5">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">{product.category}</span>
          {product.badge && (
            <span className="text-xs font-semibold font-mono text-emerald-300 transition-colors group-hover:text-blue-300">
              {product.badge}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-white tracking-tight leading-snug mb-2 group-hover:text-blue-300 transition-colors">
          {product.title}
        </h3>

        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mb-4">{product.description}</p>

        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-slate-400 pb-4 mb-4 border-b border-slate-800/80">
          <span className="text-slate-100 font-medium">{product.recordCount}</span>
          <span aria-hidden="true">·</span>
          <span>{product.fileFormat}</span>
          <span aria-hidden="true">·</span>
          <span>{product.fileSize}</span>
          <span aria-hidden="true">·</span>
          <span>Updated {product.lastUpdated}</span>
        </p>

        <ul className="space-y-2 mb-2">
          {product.highlights.slice(0, 3).map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
              <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-6 pt-0">
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white tracking-tight">₹{product.price}</span>
              <span className="text-xs font-mono text-slate-400">INR</span>
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through ml-1">
                  <span className="sr-only">Regular price </span>₹{product.originalPrice}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 block">One-time payment · instant link</span>
          </div>

          <button
            onClick={() => onPreview(product)}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-950/60 hover:bg-slate-800/60 text-slate-200 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5"
            aria-label={`Preview sample rows for ${product.title}`}
          >
            <Eye className="w-4 h-4 text-slate-400" aria-hidden="true" />
            <span>Preview</span>
          </button>
        </div>

        <button
          onClick={() => onBuyNow(product)}
          aria-label={`Buy ${product.title} for ₹${product.price}`}
          className="w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 shadow-sm flex items-center justify-center gap-2 active:scale-98 bg-white text-slate-900 group-hover:bg-blue-500 group-hover:text-slate-950 group-hover:font-bold group-hover:shadow-md group-hover:shadow-blue-500/30 hover:bg-blue-400! group-focus-within:bg-blue-500"
        >
          Buy now · ₹{product.price}
        </button>
      </div>
    </article>
  );
};
