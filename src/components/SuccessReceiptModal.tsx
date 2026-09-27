import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Clock,
  Download,
  Copy,
  Check,
  Mail,
  ExternalLink,
  ShieldAlert,
  FileCheck,
  RefreshCw,
} from 'lucide-react';

interface SuccessReceiptModalProps {
  paymentResult: {
    token: string;
    expiresAt: string;
    maxDownloads: number;
    downloadCount: number;
    productTitle: string;
    orderId: string;
    paymentId: string;
    recipientEmail: string;
  };
  onClose: () => void;
  onOpenEmailPreview: (token: string) => void;
}

export const SuccessReceiptModal: React.FC<SuccessReceiptModalProps> = ({
  paymentResult,
  onClose,
  onOpenEmailPreview,
}) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 23,
    minutes: 59,
    seconds: 59,
  });
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadCount, setDownloadCount] = useState(paymentResult.downloadCount || 0);

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  }, []);

  // Countdown timer calculations
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(paymentResult.expiresAt).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [paymentResult.expiresAt]);

  const accessUrl = `${window.location.origin}/?token=${paymentResult.token}`;
  const directDownloadUrl = `/api/download/${paymentResult.token}`;

  const copyAccessLink = () => {
    navigator.clipboard.writeText(accessUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleDownloadClick = () => {
    setIsDownloading(true);
    setDownloadCount((prev) => prev + 1);
    // Open download endpoint
    window.location.href = directDownloadUrl;
    setTimeout(() => setIsDownloading(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Success Banner */}
        <div className="px-6 py-6 border-b border-slate-800 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-blue-950/40 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Payment Verified & Access Granted!</h3>
          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
            Your transaction was processed successfully via Razorpay. Your secure, time-limited download pass is now active.
          </p>
        </div>

        {/* Scrollable Details */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Time-Limited Expiration Notice */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-amber-300 block">Time-Limited Link Active</span>
                <span className="text-[11px] text-slate-400">
                  Valid for 24 hours. Expiry timestamp: {new Date(paymentResult.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono text-sm font-bold text-amber-400">
                {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-slate-400 block">Remaining</span>
            </div>
          </div>

          {/* Download Action Box */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-blue-400 font-mono font-medium block">
                  Purchased Product
                </span>
                <h4 className="text-sm font-semibold text-white mt-0.5">{paymentResult.productTitle}</h4>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-mono">Downloads Used</span>
                <span className="text-xs font-bold text-slate-200">
                  {downloadCount} / {paymentResult.maxDownloads}
                </span>
              </div>
            </div>

            <button
              onClick={handleDownloadClick}
              disabled={isDownloading || downloadCount >= paymentResult.maxDownloads}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transform active:scale-98 disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to Secure Storage...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Database Now</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Downloads are securely routed through our server and tracked to prevent unauthorized link sharing.
            </p>
          </div>

          {/* Email Delivery Confirmation */}
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <span className="font-medium text-slate-200 block">Link Dispatched via Email</span>
                <span className="text-[11px] text-slate-400">
                  Delivered to <strong className="text-slate-300">{paymentResult.recipientEmail}</strong>
                </span>
              </div>
            </div>
            <button
              onClick={() => onOpenEmailPreview(paymentResult.token)}
              className="px-3 py-1.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <span>View Email</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Copyable Access Link */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
              Direct Access Link (Copy or Bookmark)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={accessUrl}
                className="flex-1 px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
              />
              <button
                onClick={copyAccessLink}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 text-xs font-medium shrink-0"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
            <div>
              <span>Order ID: </span>
              <span className="text-slate-300">{paymentResult.orderId}</span>
            </div>
            <div>
              <span>Payment ID: </span>
              <span className="text-slate-300">{paymentResult.paymentId}</span>
            </div>
          </div>

          {/* 24-Hour Guarantee & Support Prompt */}
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between gap-2">
            <span>Payment done but need help? Email <strong className="text-blue-400 font-mono">helpeasemymart@gmail.com</strong></span>
            <span className="text-emerald-400 font-medium shrink-0">24h SLA Guarantee</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Done & Return to Store
          </button>
        </div>
      </div>
    </div>
  );
};
