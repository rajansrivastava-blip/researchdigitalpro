import React from 'react';
import { ShieldCheck, Lock, Mail, Clock, CreditCard, EyeOff, X, FileText, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Privacy Policy</h2>
              <p className="text-[11px] text-slate-400">
                Research Dital Pro · Last updated: September 2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed font-sans">
          {/* Trust Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-semibold text-[11px]">No Stored Cards</div>
                <div className="text-[10px] text-slate-400">100% processed via Razorpay PCI-DSS Level 1 gateway.</div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <EyeOff className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-semibold text-[11px]">No Ad Tracking</div>
                <div className="text-[10px] text-slate-400">Zero selling or sharing of buyer data to 3rd-party advertisers.</div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-semibold text-[11px]">Encrypted Passes</div>
                <div className="text-[10px] text-slate-400">256-bit cryptographically signed 24h expiration links.</div>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-300 text-[10px] font-mono flex items-center justify-center">1</span>
              Information We Collect
            </h3>
            <p>
              When you purchase or request datasets from <strong>Research Dital Pro</strong>, we collect only the necessary details required to deliver and authenticate your digital downloads:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong className="text-slate-200">Customer Identity:</strong> Full Name, Email Address, and Phone Number (used solely for order confirmation and automated link delivery).</li>
              <li><strong className="text-slate-200">Payment Metadata:</strong> Transaction ID, Order ID, and currency amount provided by the payment gateway (Razorpay). We do <em>not</em> view, record, or store debit/credit card numbers, UPI PINs, or net banking passwords.</li>
              <li><strong className="text-slate-200">Digital Access Logs:</strong> IP address, timestamp, and device user-agent when redeeming a 24-hour download token, strictly used to prevent token piracy and link abuse.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-300 text-[10px] font-mono flex items-center justify-center">2</span>
              How We Use Your Information
            </h3>
            <p>
              Your personal information is used exclusively for the following operational purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Generating and transmitting your time-limited 24-hour cryptographic download pass to your email.</li>
              <li>Providing instant customer support and link re-issuance via <a href="mailto:helpeasemymart@gmail.com" className="text-blue-400 hover:underline">helpeasemymart@gmail.com</a>.</li>
              <li>Validating legitimate transaction records and issuing purchase invoices.</li>
              <li>Safeguarding our Google Drive repository against automated web scraping, denial of service, and unauthorized redistribution.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-300 text-[10px] font-mono flex items-center justify-center">3</span>
              Payment Security & Razorpay
            </h3>
            <p>
              All online transactions are securely routed through <strong>Razorpay</strong>, India's leading RBI-authorized payment aggregator with PCI-DSS Level 1 compliance. All credit card, debit card, UPI, and Netbanking communications are end-to-end encrypted with 256-bit TLS protocol.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-300 text-[10px] font-mono flex items-center justify-center">4</span>
              Digital Vault Access & Link Lifetime
            </h3>
            <p>
              To protect the intellectual integrity of our 2026 scrubbed databases and research folders, raw Google Drive folder paths are hidden behind a secure server-side redirector. Each download pass expires automatically after <strong>24 hours</strong> or after reaching <strong>5 download cycles</strong>. If you need your access link refreshed, you can contact our support team at any time.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-300 text-[10px] font-mono flex items-center justify-center">5</span>
              Data Protection & Your Rights
            </h3>
            <p>
              We honor your privacy and data autonomy. You have the right to request access to your transaction records, request correction of any inaccurate details, or request deletion of your order contact history from our customer logs.
            </p>
          </div>

          {/* Section 6 - Contact */}
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 space-y-2">
            <h4 className="text-xs font-semibold text-white flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              Contact Our Data Privacy Officer
            </h4>
            <p className="text-[11px] text-slate-400">
              For any privacy inquiries, refund questions, or link re-issuance requests, write directly to:
            </p>
            <div className="flex items-center gap-3">
              <a
                href="mailto:helpeasemymart@gmail.com"
                className="text-xs font-mono font-bold text-blue-400 hover:text-blue-300 underline"
              >
                helpeasemymart@gmail.com
              </a>
              <span className="text-[10px] text-slate-500 font-medium">· Response within 2 hours</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>GDPR & IT Act 2000 Compliant Practices</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors text-xs shadow-sm"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
