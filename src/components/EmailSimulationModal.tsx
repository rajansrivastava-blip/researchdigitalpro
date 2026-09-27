import React, { useState } from 'react';
import { X, Mail, ShieldCheck, Clock, Download, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AccessDetails } from '../types.ts';

interface EmailSimulationModalProps {
  accessDetails: AccessDetails | null;
  onClose: () => void;
}

export const EmailSimulationModal: React.FC<EmailSimulationModalProps> = ({ accessDetails, onClose }) => {
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  if (!accessDetails) return null;

  const handleResend = async () => {
    setIsResending(true);
    setResendStatus(null);
    try {
      const res = await fetch('/api/resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: accessDetails.token, email: accessDetails.customerEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendStatus(`Link re-dispatched to ${accessDetails.customerEmail}`);
      } else {
        setResendStatus(data.error || 'Failed to resend email');
      }
    } catch (e: any) {
      setResendStatus(e.message || 'Network error');
    } finally {
      setIsResending(false);
    }
  };

  const directDownloadUrl = `/api/download/${accessDetails.token}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Email Client Header bar */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400" />
            <span className="font-medium text-slate-200">Customer Email Dispatch Preview</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
            aria-label="Close email preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Email Envelope Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 text-xs space-y-1.5 font-sans">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-16 text-slate-400">From:</span>
            <span className="text-slate-200 font-medium">Research Dital Pro Secure Delivery &lt;helpeasemymart@gmail.com&gt;</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-16 text-slate-400">To:</span>
            <span className="text-blue-300 font-mono">{accessDetails.customerEmail}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-16 text-slate-400">Subject:</span>
            <span className="text-white font-semibold">
              Your Secure Download Pass: {accessDetails.productTitle} (Valid for 24 Hours)
            </span>
          </div>
        </div>

        {/* Email Body Rendering */}
        <div className="p-6 overflow-y-auto space-y-5 bg-white text-slate-900 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <span>Research Dital Pro</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Receipt #{accessDetails.orderId}</span>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Hello {accessDetails.customerName || 'Customer'},</h4>
            <p className="text-slate-600 leading-relaxed">
              Thank you for your purchase! Your payment of <strong>₹{accessDetails.amount} INR</strong> has been verified via Razorpay. Your secure, time-limited access to <strong>{accessDetails.productTitle}</strong> is ready.
            </p>
          </div>

          {/* Call to action inside email */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
              <span>Access Link Expires in 24 Hours</span>
            </div>

            <div>
              <a
                href={directDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm text-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Your Digital Product</span>
              </a>
            </div>

            <p className="text-[10px] text-slate-500">
              To safeguard database integrity, this download pass permits up to {accessDetails.maxDownloads} downloads.
            </p>
          </div>

          {/* Purchase Summary */}
          <div className="border border-slate-200 rounded-lg p-3.5 space-y-2 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Item:</span>
              <span className="font-medium text-slate-900">{accessDetails.productTitle}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Format:</span>
              <span className="font-medium text-slate-900">{accessDetails.fileFormat}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Razorpay Payment ID:</span>
              <span className="font-mono text-slate-800">{accessDetails.paymentId}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Expiry Date:</span>
              <span className="text-amber-800 font-medium">
                {new Date(accessDetails.expiresAt).toLocaleString()}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-200 pt-3">
            If you experience any issues or need to re-issue your link, please reply directly to this email or reach us at {accessDetails.supportEmail}.
          </p>
        </div>

        {/* Modal Action Controls */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
          <div>
            {resendStatus && (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {resendStatus}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleResend}
              disabled={isResending}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              <span>{isResending ? 'Sending...' : 'Resend Email Link'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors text-xs"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
