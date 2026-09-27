import Link from 'next/link';
import { Database, Download } from 'lucide-react';
import { BRAND_SHORT } from '@/lib/constants';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 group rounded-lg shrink-0" aria-label="Research Digital Pro home">
          <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-500 transition-colors">
            <Database className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="font-black text-white text-base tracking-tight">{BRAND_SHORT}</span>
            <span className="text-xs text-blue-300 font-mono font-medium">Pro</span>
          </span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link
            href="/#catalog"
            className="hidden sm:inline-flex px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
          >
            Datasets
          </Link>
          <Link
            href="/contact"
            className="hidden sm:inline-flex px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
          >
            Support
          </Link>
          <Link
            href="/access"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-white bg-slate-900 ring-1 ring-slate-700 hover:ring-slate-500 transition-colors"
          >
            <Download className="w-4 h-4 text-blue-400" aria-hidden="true" />
            <span className="hidden min-[380px]:inline">My download</span>
            <span className="min-[380px]:hidden">Download</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
