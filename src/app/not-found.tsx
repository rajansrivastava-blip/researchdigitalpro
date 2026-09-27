import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false } };

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-sm font-mono text-blue-300">404</p>
      <h1 className="mt-2 text-3xl font-black text-white">This page doesn&apos;t exist</h1>
      <p className="mt-3 text-slate-400">The link may be mistyped or out of date.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-sm">
          Browse datasets
        </Link>
        <Link href="/access" className="px-5 py-2.5 rounded-lg ring-1 ring-slate-700 hover:bg-white/5 text-slate-200 font-semibold text-sm">
          Find my download
        </Link>
      </div>
    </div>
  );
}
