'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/** Route-level error boundary: shows a friendly message with a retry instead of a blank page. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-sm font-mono text-rose-300">Something went wrong</p>
      <h1 className="mt-2 text-3xl font-black text-white">We couldn&apos;t load this page</h1>
      <p className="mt-3 text-slate-400">
        Please try again. If you had just paid, the payment is recorded with Razorpay and you can recover your pass on the download
        page.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-sm">
          Try again
        </button>
        <Link href="/access" className="px-5 py-2.5 rounded-lg ring-1 ring-slate-700 hover:bg-white/5 text-slate-200 font-semibold text-sm">
          Find my download
        </Link>
      </div>
      {error.digest && <p className="mt-6 text-xs font-mono text-slate-500">Reference: {error.digest}</p>}
    </div>
  );
}
