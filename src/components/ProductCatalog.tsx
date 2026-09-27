import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, FileText, Database, ShieldCheck, Sparkles } from 'lucide-react';
import { Product } from '../types.ts';
import { ProductCard } from './ProductCard.tsx';

interface ProductCatalogProps {
  products: Product[];
  onPreview: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ products, onPreview, onBuyNow }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = useMemo(() => {
    const list = [
      { id: 'all', label: 'All Datasets' },
      { id: 'United States', label: 'US Data (₹79 Only)' },
      { id: 'International', label: 'Global Leads (₹49)' },
      { id: 'E-Commerce', label: 'Shopify Brands (₹49)' },
      { id: 'Real Estate', label: 'Real Estate (₹49)' },
      { id: 'Technology', label: 'Tech Startups (₹49)' },
      { id: 'VIP Bundle', label: 'Full Vault Bundle (₹249)' },
    ];
    return list;
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>VERIFIED DIGITAL REPOSITORY</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Available Digital Datasets</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Download enterprise-grade verified databases with 100% unmasked fields. Instant Razorpay checkout and time-limited download links.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dataset keywords..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 2026 Fresh Data Announcement Banner */}
      <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-blue-950/60 border border-emerald-800/40 flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-emerald-950/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white tracking-wide">2026 Fresh Updated Datasets Now Included</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                2026 VERIFIED
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              All files now include fresh 2026 updated contacts, scrubbed email addresses, and verified phone numbers.
            </p>
          </div>
        </div>
        <div className="text-xs font-mono text-slate-300 flex flex-wrap items-center gap-2.5">
          <span className="text-emerald-400 font-semibold">Individual Datasets: ₹49</span>
          <span className="text-slate-600">·</span>
          <span className="text-blue-400 font-semibold">USA Data: ₹79</span>
          <span className="text-slate-600">·</span>
          <span className="text-amber-400 font-semibold">Master VIP Bundle: ₹249</span>
        </div>
      </div>

      {/* Interactive Category Filter Tabs (Zero-Pill discipline compliant) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800/80 rounded-xl overflow-x-auto mb-8 text-xs font-medium text-slate-400">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No datasets matched your query</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Try adjusting your search terms or reset the category filters to browse all files.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPreview={onPreview}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      )}

      {/* Custom Drive File Notice */}
      <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-blue-950/30 via-slate-900 to-slate-950 border border-blue-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CUSTOM FILE REQUESTS FROM GOOGLE DRIVE VAULT</span>
          </div>
          <h3 className="text-base font-bold text-white">Need a specific file from our Drive repository?</h3>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            All individual database downloads in our Google Drive repository are available for only <strong>₹49 INR</strong>, with US Data priced at a special <strong>₹79 INR</strong>. Each purchase is delivered via a time-limited 24h cryptographically secure email link.
          </p>
        </div>
        <button
          onClick={() => {
            const defaultProduct = products.find((p) => p.id === 'us-data') || products[0];
            if (defaultProduct) onBuyNow(defaultProduct);
          }}
          className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm whitespace-nowrap transition-colors shrink-0"
        >
          Get US Data (₹79)
        </button>
      </div>
    </section>
  );
};
