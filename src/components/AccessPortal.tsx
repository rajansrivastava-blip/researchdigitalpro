import React, { useState, useEffect } from 'react';
import { Search, Clock, Download, AlertTriangle, ShieldCheck, Mail, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AccessDetails } from '../types.ts';

interface AccessPortalProps {
  initialToken?: string;
  onBackToStore: () => void;
  onOpenEmailPreview: (token: string) => void;
}

export const AccessPortal: React.FC<AccessPortalProps> = ({
  initialToken = '',
  onBackToStore,
  onOpenEmailPreview,
}) => {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [isLoading, setIsLoading] = useState(false);
  const [accessData, setAccessData] = useState<AccessDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchAccess = async (tokenToFetch: string) => {
    if (!tokenToFetch.trim()) {
      setError('Please provide a valid download token.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/access/${encodeURIComponent(tokenToFetch.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Access token not found or expired.');
      }
      setAccessData(data);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve access details.');
      setAccessData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken) {
      fetchAccess(initialToken);
    }
  }, [initialToken]);

  // Live countdown timer for active token
  useEffect(() => {
    if (!accessData) return;

    const tick = () => {
      const diff = new Date(accessData.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ hours, minutes, seconds });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [accessData]);

  const handleDownload = () => {
    if (!accessData) return;
    setIsDownloading(true);
    window.location.href = `/api/download/${accessData.token}`;
    setTimeout(() => {
      setIsDownloading(false);
      // Refresh count
      fetchAccess(accessData.token);
    }, 2500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBackToStore}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Product Catalog</span>
        </button>
        <span className="text-xs text-slate-500 font-mono">Secure Token Verification</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Token Search Bar */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/40">
          <h2 className="text-lg font-bold text-white mb-1">Customer Download Verification Portal</h2>
          <p className="text-xs text-slate-400 mb-4">
            Enter the 24-hour access token sent to your email or receipt to retrieve your purchased digital files.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchAccess(tokenInput);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter access token (e.g. 9f4b...)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
            >
              {isLoading ? 'Verifying...' : 'Verify Access'}
            </button>
          </form>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-6 border-b border-slate-800 bg-red-950/20 text-xs text-red-300 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Verification Failed</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Access Token Result */}
        {accessData && (
          <div className="p-6 space-y-6">
            {/* Status Strip */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                accessData.accessStatus === 'active'
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                  : accessData.accessStatus === 'expired'
                  ? 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                  : 'bg-red-950/20 border-red-800/40 text-red-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5" />
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider block">
                    Access Pass: {accessData.accessStatus.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {accessData.accessStatus === 'active'
                      ? 'Link is cryptographically signed and active.'
                      : 'This token has expired or reached the limit.'}
                  </span>
                </div>
              </div>

              {accessData.accessStatus === 'active' && timeLeft && (
                <div className="text-right font-mono">
                  <span className="text-sm font-bold text-emerald-400">
                    {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Remaining</span>
                </div>
              )}
            </div>

            {/* Product summary card */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Digital Asset</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{accessData.productTitle}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span>Format: {accessData.fileFormat}</span>
                    <span>·</span>
                    <span>Size: {accessData.fileSize}</span>
                    <span>·</span>
                    <span>Paid: ₹{accessData.amount} INR</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-400 block text-[11px]">Downloads Used</span>
                  <span className="font-bold text-slate-200">
                    {accessData.downloadCount} of {accessData.maxDownloads}
                  </span>
                </div>
              </div>

              {accessData.accessStatus === 'active' ? (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading || accessData.downloadsRemaining <= 0}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs shadow-md disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Opening Secure File...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Dataset ({accessData.downloadsRemaining} downloads left)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-3 bg-red-950/30 rounded-lg text-xs text-red-300 text-center border border-red-900/50">
                  This download link is no longer valid. If you need renewal, contact {accessData.supportEmail}.
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <span>Receipt: #{accessData.orderId}</span>
                <button
                  onClick={() => onOpenEmailPreview(accessData.token)}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  View Delivery Email
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
