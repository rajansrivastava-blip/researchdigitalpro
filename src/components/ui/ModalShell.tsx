'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export type ModalAccent = 'blue' | 'emerald' | 'amber' | 'violet';

const ACCENTS: Record<
  ModalAccent,
  { frame: string; bar: string; glow: string; tile: string; eyebrow: string; shadow: string }
> = {
  blue: {
    frame: 'from-blue-500/60 via-slate-700/60 to-slate-800/40',
    bar: 'from-blue-500 via-cyan-300 to-indigo-500',
    glow: 'bg-blue-500/25',
    tile: 'from-blue-500/25 to-indigo-500/10 text-blue-300 ring-blue-400/30',
    eyebrow: 'text-blue-300',
    shadow: 'shadow-blue-950/60',
  },
  emerald: {
    frame: 'from-emerald-400/60 via-slate-700/60 to-slate-800/40',
    bar: 'from-emerald-400 via-teal-200 to-cyan-500',
    glow: 'bg-emerald-500/25',
    tile: 'from-emerald-500/25 to-teal-500/10 text-emerald-300 ring-emerald-400/30',
    eyebrow: 'text-emerald-300',
    shadow: 'shadow-emerald-950/60',
  },
  amber: {
    frame: 'from-amber-400/60 via-slate-700/60 to-slate-800/40',
    bar: 'from-amber-400 via-yellow-200 to-orange-500',
    glow: 'bg-amber-500/20',
    tile: 'from-amber-500/25 to-orange-500/10 text-amber-300 ring-amber-400/30',
    eyebrow: 'text-amber-300',
    shadow: 'shadow-amber-950/60',
  },
  violet: {
    frame: 'from-violet-400/60 via-slate-700/60 to-slate-800/40',
    bar: 'from-violet-500 via-fuchsia-300 to-blue-500',
    glow: 'bg-violet-500/25',
    tile: 'from-violet-500/25 to-fuchsia-500/10 text-violet-300 ring-violet-400/30',
    eyebrow: 'text-violet-300',
    shadow: 'shadow-violet-950/60',
  },
};

const SIZES = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
} as const;

// Stack of open modals, so Escape only closes the top one and scroll lock is shared.
const openStack: string[] = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalShellProps {
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  icon?: ReactNode;
  accent?: ModalAccent;
  size?: keyof typeof SIZES;
  /** Extra content placed in the header, left of the close button. */
  headerExtra?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  /** Remove body padding, for layouts that manage their own. */
  flush?: boolean;
  closeLabel?: string;
}

/**
 * Shared frame for every modal: gradient border, animated accent bar, glowing header,
 * bottom sheet on phones, Escape / backdrop to close, and background scroll lock.
 */
export function ModalShell({
  onClose,
  title,
  subtitle,
  eyebrow,
  icon,
  accent = 'blue',
  size = 'md',
  headerExtra,
  footer,
  children,
  flush = false,
  closeLabel = 'Close',
}: ModalShellProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  const a = ACCENTS[accent];

  useEffect(() => {
    openStack.push(id);
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (openStack[openStack.length - 1] !== id) return; // only the top-most modal reacts
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      // Keep keyboard focus inside the dialog.
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === firstEl || active === panelRef.current)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      openStack.splice(openStack.indexOf(id), 1);
      if (openStack.length === 0) document.body.style.overflow = previousOverflow;
      // Return focus to whatever opened the dialog.
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus();
    };
  }, [id]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12),transparent_60%)]"
      />

      {/* Gradient frame */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative w-full ${SIZES[size]} max-h-[92dvh] sm:max-h-[88vh] flex flex-col p-px rounded-t-3xl sm:rounded-3xl bg-linear-to-b ${a.frame} shadow-2xl ${a.shadow} outline-none animate-sheet-in sm:animate-modal-in`}
      >
        <div className="relative flex-1 min-h-0 flex flex-col rounded-t-[calc(1.5rem-1px)] sm:rounded-[calc(1.5rem-1px)] bg-slate-950 overflow-hidden text-slate-100">
          {/* Animated accent bar */}
          <div
            aria-hidden="true"
            className={`h-1 w-full shrink-0 bg-linear-to-r ${a.bar} bg-size-[200%_100%] animate-shimmer`}
          />

          {/* Phone grab handle */}
          <div aria-hidden="true" className="sm:hidden flex justify-center pt-2">
            <span className="h-1 w-10 rounded-full bg-slate-700" />
          </div>

          {/* Header */}
          <header className="relative shrink-0 px-5 sm:px-6 pt-4 pb-4 border-b border-white/5 overflow-hidden">
            <div aria-hidden="true" className={`pointer-events-none absolute -top-24 -right-16 h-48 w-48 rounded-full blur-3xl ${a.glow}`} />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(rgba(148,163,184,0.12)_1px,transparent_1px)] bg-size-[14px_14px] mask-[linear-gradient(to_bottom,black,transparent)]"
            />
            <div className="relative flex items-start gap-3.5">
              {icon && (
                <div
                  className={`shrink-0 w-11 h-11 rounded-2xl bg-linear-to-br ${a.tile} ring-1 flex items-center justify-center shadow-inner`}
                >
                  {icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                {eyebrow && (
                  <div className={`text-[11px] font-mono font-semibold uppercase tracking-[0.18em] mb-0.5 ${a.eyebrow}`}>
                    {eyebrow}
                  </div>
                )}
                <h2 id={titleId} className="text-lg font-bold text-white tracking-tight leading-snug">
                  {title}
                </h2>
                {subtitle && <div className="text-[11px] text-slate-400 mt-0.5">{subtitle}</div>}
              </div>
              {headerExtra}
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 bg-white/5 ring-1 ring-white/10 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Body */}
          <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain ${flush ? '' : 'p-5 sm:p-6'}`}>{children}</div>

          {/* Footer */}
          {footer && (
            <footer className="shrink-0 px-5 sm:px-6 py-4 border-t border-white/5 bg-slate-900/70 backdrop-blur pb-[max(1rem,env(safe-area-inset-bottom))]">
              {footer}
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}

/** Numbered badge used by legal modals and step lists. */
export function StepBadge({ n, active = true }: { n: number | string; active?: boolean }) {
  return (
    <span
      className={`shrink-0 w-6 h-6 rounded-full text-[11px] font-mono font-bold flex items-center justify-center ring-1 ${
        active ? 'bg-blue-500/20 text-blue-200 ring-blue-400/40' : 'bg-slate-800 text-slate-400 ring-slate-700'
      }`}
    >
      {n}
    </span>
  );
}

/** HH:MM:SS countdown rendered as glowing digit tiles. */
export function CountdownTiles({
  hours,
  minutes,
  seconds,
  tone = 'amber',
}: {
  hours: number;
  minutes: number;
  seconds: number;
  tone?: 'amber' | 'emerald';
}) {
  const tile =
    tone === 'amber'
      ? 'bg-amber-500/10 ring-amber-400/30 text-amber-300'
      : 'bg-emerald-500/10 ring-emerald-400/30 text-emerald-300';
  const parts = [
    { v: hours, l: 'HRS' },
    { v: minutes, l: 'MIN' },
    { v: seconds, l: 'SEC' },
  ];
  return (
    <div className="flex items-center gap-1.5" role="timer" aria-label={`${hours} hours ${minutes} minutes ${seconds} seconds remaining`}>
      {parts.map((p, i) => (
        <div key={p.l} className="flex items-center gap-1.5">
          <div className={`min-w-11 px-1.5 py-1 rounded-lg ring-1 text-center ${tile}`}>
            <div className="font-mono text-base font-bold leading-none tabular-nums">{String(p.v).padStart(2, '0')}</div>
            <div className="text-[10px] font-mono tracking-widest text-slate-400 mt-0.5">{p.l}</div>
          </div>
          {i < parts.length - 1 && <span className="text-slate-500 font-bold">:</span>}
        </div>
      ))}
    </div>
  );
}
