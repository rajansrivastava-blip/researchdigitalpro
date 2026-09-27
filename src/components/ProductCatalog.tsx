'use client';

import React, { useMemo, useState } from 'react';
import { Database, FileText, Mail, Search } from 'lucide-react';
import type { Product } from '@/types';
import { BUNDLE_PRODUCT_ID } from '@/data/products';
import { ProductCard } from './ProductCard';
import { useAppUI } from './AppProviders';

interface ProductCatalogProps {
  products: Product[];
  onPreview: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  'United States': 'US data',
  International: 'Global executives',
  'E-Commerce': 'E-commerce brands',
  'Real Estate': 'Real estate',
  Technology: 'Tech startups',
  Marketing: 'Marketing agencies',
  'Complete Bundle': 'Complete bundle',
};

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ products, onPreview, onBuyNow }) => {
  const { storeInfo } = useAppUI();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Tabs are built from the catalog, so labels and prices can never go out of date.
  const categories = useMemo(() => {
    const seen = new Map<string, Product[]>();
    for (const p of products) seen.set(p.category, [...(seen.get(p.category) || []), p]);
    return [
      { id: 'all', label: 'All datasets', count: products.length },
      ...[...seen.entries()].map(([id, items]) => ({
        id,
        label: `${CATEGORY_LABELS[id] || id} · ₹${Math.min(...items.map((i) => i.price))}`,
        count: items.length,
      })),
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const bundle = products.find((p) => p.id === BUNDLE_PRODUCT_ID);

  return (
    <section id="catalog" aria-labelledby="catalog-title" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <p className="flex items-center gap-2 text-xs font-mono text-blue-300 mb-2">
            <Database className="w-3.5 h-3.5" aria-hidden="true" />
            DATASET CATALOG
          </p>
          <h2 id="catalog-title" className="text-3xl font-black text-white tracking-tight">
            Choose a dataset
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Preview sample rows before you buy. Every purchase includes the complete file with all contact fields.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <label htmlFor="catalog-search" className="sr-only">
            Search datasets
          </label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            id="catalog-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search datasets"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div
        role="group"
        aria-label="Filter by category"
        className="flex items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800/80 rounded-xl overflow-x-auto mb-8 text-sm font-medium text-slate-300"
      >
        {categories.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              aria-pressed={active}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                active ? 'bg-blue-600 text-white font-semibold' : 'hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${active ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-300'}`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
          <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" aria-hidden="true" />
          <h3 className="text-base font-bold text-white mb-1">No datasets match your search</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">Try a different keyword, or clear the filters to see every dataset.</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onPreview={onPreview} onBuyNow={onBuyNow} />
          ))}
        </div>
      )}

      <div className="mt-12 p-6 rounded-2xl bg-linear-to-r from-blue-950/30 via-slate-900 to-slate-950 border border-blue-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Looking for something specific?</h3>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Email us with the data you need and we will tell you which file covers it.
            {bundle && ` The complete bundle includes every folder in our repository for ₹${bundle.price}.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <a
            href={`mailto:${storeInfo.supportEmail}?subject=${encodeURIComponent('Dataset request')}`}
            className="px-5 py-2.5 rounded-lg ring-1 ring-slate-700 hover:bg-white/5 text-slate-200 text-sm font-semibold flex items-center gap-2"
          >
            <Mail className="w-4 h-4" aria-hidden="true" />
            Email us
          </a>
          {bundle && (
            <button
              onClick={() => onBuyNow(bundle)}
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-sm rounded-lg transition-colors"
            >
              Buy complete bundle · ₹{bundle.price}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
