import type { ReactNode } from 'react';

/** Wraps numbered legal sections in a vertical timeline. */
export function LegalTimeline({ children }: { children: ReactNode }) {
  return <ol className="relative space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-linear-to-b before:from-blue-500/60 before:via-slate-700 before:to-transparent">{children}</ol>;
}

export function LegalSection({
  n,
  title,
  highlight = false,
  children,
}: {
  n: number;
  title: ReactNode;
  highlight?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="relative pl-10">
      <span
        className={`absolute left-0 top-0 w-6 h-6 rounded-full text-[11px] font-mono font-bold flex items-center justify-center ring-4 ring-slate-950 ${
          highlight ? 'bg-blue-500 text-white shadow-[0_0_14px_rgba(59,130,246,0.6)]' : 'bg-slate-800 text-blue-300'
        }`}
      >
        {n}
      </span>
      <div className={highlight ? 'rounded-2xl p-4 bg-blue-500/5 ring-1 ring-blue-400/25 -mt-1' : ''}>
        <h2 className="text-base font-bold text-white mb-2 leading-6">{title}</h2>
        <div className="space-y-2 text-slate-400">{children}</div>
      </div>
    </li>
  );
}

/** Small icon + label card used at the top of the legal modals. */
export function TrustCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="p-3 rounded-2xl bg-slate-900/60 ring-1 ring-slate-800 flex items-start gap-2.5">
      <span className="w-7 h-7 rounded-lg bg-white/5 ring-1 ring-white/10 flex items-center justify-center shrink-0">{icon}</span>
      <div>
        <div className="text-white font-semibold text-xs">{title}</div>
        <div className="text-xs text-slate-400 leading-snug">{text}</div>
      </div>
    </div>
  );
}
