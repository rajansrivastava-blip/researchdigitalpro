import React from 'react';
import { FileCheck, ShieldCheck, Mail, Clock, RefreshCw, AlertCircle, X, HelpCircle, CheckCircle2 } from 'lucide-react';

interface TermsAndConditionsModalProps {
  onClose: () => void;
}

export const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Terms & Conditions</h2>
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
          {/* Key Guarantees Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30 border border-blue-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>24-Hour Delivery Guarantee For Undelivered Orders</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              If your payment is successful and you haven't received your digital product or download link, our team will verify your transaction and share your files within <strong>24 hours</strong> upon receiving your email at <strong className="text-blue-300">helpeasemymart@gmail.com</strong>.
            </p>
          </div>

          {/* Quick Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-semibold text-[11px]">Email Resolution</div>
                <div className="text-[10px] text-slate-400">Direct support resolution via helpeasemymart@gmail.com.</div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <RefreshCw className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-semibold text-[11px]">Free Re-issue</div>
                <div className="text-[10px] text-slate-400">Expired download passes can be re-issued upon customer request.</div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-semibold text-[11px]">Razorpay Verified</div>
                <div className="text-[10px] text-slate-400">Every transaction backed by verified payment gateway IDs.</div>
              </div>
            </div>
          </div>

          {/* Section 1: Introduction & Agreement */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-blue-400 font-mono">1</span>
              Agreement to Terms
            </h3>
            <p className="text-slate-400">
              Welcome to <strong>Research Dital Pro</strong>. By accessing our catalog, initiating a payment, or purchasing any of our digital database products or bundles, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, please do not use our services.
            </p>
          </div>

          {/* Section 2: Payment Done & Product Delivery Guarantee (User's Specific Requirement) */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-950/70 border border-blue-900/40">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-mono">2</span>
              Payment Completed But Product Not Received? (24-Hour Guarantee)
            </h3>
            <p className="text-slate-300">
              While our system automatically generates digital download passes and sends an email receipt immediately upon successful payment through Razorpay, occasional email delivery delays, spam filters, or network interruptions may occur.
            </p>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
              <p className="text-white font-medium text-[11px]">
                In case your payment is done and you have not received your product:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li>Please send an email to us at: <a href="mailto:helpeasemymart@gmail.com" className="text-blue-400 underline font-mono">helpeasemymart@gmail.com</a></li>
                <li>Include your <strong>Razorpay Payment ID</strong> (e.g., <span className="font-mono text-slate-300">pay_xxxxxxxx</span>) or transaction confirmation screenshot.</li>
                <li>Mention the <strong>Customer Email Address</strong> entered during checkout and the name of the purchased dataset.</li>
              </ul>
              <div className="flex items-center gap-2 text-emerald-400 text-[11px] pt-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>We guarantee to review your payment and share your product access within 24 hours of receiving your email.</span>
              </div>
            </div>
          </div>

          {/* Section 3: Digital Product Delivery & Link Expiry */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-blue-400 font-mono">3</span>
              Digital Delivery &amp; 24-Hour Link Validity
            </h3>
            <p className="text-slate-400">
              All products sold on Research Dital Pro are intangible digital goods delivered electronically via secure Google Drive repository download passes.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li>Each purchase generates a cryptographically signed token pass valid for <strong>24 hours</strong> from the time of generation.</li>
              <li>A default limit of <strong>5 download sessions</strong> is attached to each token to prevent unauthorized link sharing.</li>
              <li>If your 24-hour pass expires before you complete your download, you may use our <strong>Access Pass Portal</strong> on the site or email <span className="font-mono text-slate-300">helpeasemymart@gmail.com</span> with your Payment ID to receive a fresh access link at no extra cost.</li>
            </ul>
          </div>

          {/* Section 4: Refund & Cancellation Policy */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-blue-400 font-mono">4</span>
              Refund &amp; Cancellation Policy
            </h3>
            <p className="text-slate-400">
              Due to the digital, downloadable, and irrevocable nature of database records, spreadsheets, and files:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li>All sales are considered final once the digital files or repository links have been successfully delivered and downloaded.</li>
              <li>If you encounter technical issues accessing the Google Drive folder, we will first provide alternative links or direct file delivery.</li>
              <li>In the rare event that payment was deducted twice or the digital product cannot be delivered within our promised 24-hour window, a full refund will be processed back to the original payment source via Razorpay.</li>
            </ul>
          </div>

          {/* Section 5: License, Fair Use & Intellectual Property */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-blue-400 font-mono">5</span>
              Permitted Usage &amp; Restrictions
            </h3>
            <p className="text-slate-400">
              Purchasing a dataset grants you a non-exclusive, non-transferable license to use the data for:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                <span className="text-emerald-400 font-semibold block mb-0.5">✓ Permitted:</span>
                Internal business intelligence, marketing analysis, client prospecting, direct B2B/B2C communications, and market research.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                <span className="text-rose-400 font-semibold block mb-0.5">✕ Prohibited:</span>
                Reselling, sublicensing, publishing raw database repositories publicly, or redistributing master Google Drive links to third parties.
              </div>
            </div>
          </div>

          {/* Section 6: Payment Gateway & Currency */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-blue-400 font-mono">6</span>
              Payment Processing &amp; Pricing
            </h3>
            <p className="text-slate-400">
              All prices are listed in Indian Rupees (INR) — including individual datasets at ₹49 INR, US Data at ₹79 INR, and the VIP Master Bundle at ₹249 INR. Payments are securely processed through Razorpay using UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, or Wallets.
            </p>
          </div>

          {/* Section 7: Support & Contact Details */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              Need Assistance or Have Questions?
            </h4>
            <p className="text-slate-400 text-[11px]">
              For any payment inquiries, undelivered order assistance, or re-issue requests:
            </p>
            <div className="text-[11px] space-y-1">
              <div>
                <span className="text-slate-500">Official Support Email: </span>
                <a href="mailto:helpeasemymart@gmail.com" className="text-blue-400 font-mono hover:underline">
                  helpeasemymart@gmail.com
                </a>
              </div>
              <div>
                <span className="text-slate-500">Store Name: </span>
                <span className="text-slate-300">Research Dital Pro</span>
              </div>
              <div>
                <span className="text-slate-500">Resolution SLA: </span>
                <span className="text-slate-300 font-medium">Within 24 Hours Guaranteed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            By purchasing, you acknowledge and agree to these terms.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors text-xs shadow-sm"
          >
            I Understand &amp; Agree
          </button>
        </div>
      </div>
    </div>
  );
};
