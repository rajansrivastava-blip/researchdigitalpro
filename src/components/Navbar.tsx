import React from 'react';
import { Database, ShieldCheck, KeyRound, Download, Sliders, ExternalLink } from 'lucide-react';

interface NavbarProps {
  onOpenAccessPortal: () => void;
  onOpenAdmin: () => void;
  onGoHome: () => void;
  onOpenRazorpaySettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenAccessPortal, 
  onOpenAdmin, 
  onGoHome,
  onOpenRazorpaySettings,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-500 transition-colors">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-white text-base tracking-tight">Research Dital</span>
              <span className="text-[10px] text-blue-400 font-mono font-medium">Pro</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono -mt-0.5">Razorpay Secured</p>
          </div>
        </button>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenAccessPortal}
            className="text-xs text-slate-300 hover:text-white font-medium transition-colors flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Track Download Pass</span>
            <span className="sm:hidden">Passes</span>
          </button>

          {onOpenRazorpaySettings && (
            <button
              onClick={onOpenRazorpaySettings}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40"
              title="Razorpay Gateway Credentials & Testing"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>Razorpay Setup</span>
            </button>
          )}

          <button
            onClick={onOpenAdmin}
            className="text-xs text-slate-300 hover:text-white font-medium transition-colors flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700"
            title="Owner Dashboard & Real-Time Download Tracking"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Merchant &amp; Logs</span>
            <span className="md:hidden">Logs</span>
          </button>
        </div>
      </div>
    </header>
  );
};
