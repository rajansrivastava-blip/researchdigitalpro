import React from 'react';
import { ShieldCheck, Mail, Lock, ExternalLink, FileText } from 'lucide-react';

interface FooterProps {
  onOpenAccessPortal: () => void;
  onOpenAdmin: () => void;
  onOpenPrivacyPolicy: () => void;
  onOpenTerms: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onOpenAccessPortal, 
  onOpenAdmin, 
  onOpenPrivacyPolicy,
  onOpenTerms 
}) => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <span className="font-bold text-white text-sm block">Research Dital Pro</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Automated, secure digital product distribution platform powered by Razorpay payment settlement and encrypted 24h signed links.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Prices: US Data at ₹79 INR · All Other Datasets at ₹49 INR · VIP Bundle at ₹249 INR
            </div>
          </div>

          {/* Customer Protection */}
          <div className="space-y-2">
            <span className="font-semibold text-white block">Download Security Policy</span>
            <ul className="space-y-1.5 text-[11px]">
              <li>• Raw Google Drive paths hidden prior to payment</li>
              <li>• 24-hour cryptographic token access lifetime</li>
              <li>• Automated customer delivery receipt email</li>
              <li>• IP & device logging to prevent link piracy</li>
            </ul>
          </div>

          {/* Quick links */}
          <div className="space-y-2">
            <span className="font-semibold text-white block">Quick Access & Legal</span>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button onClick={onOpenAccessPortal} className="hover:text-white transition-colors">
                  Look Up Purchased Access Pass
                </button>
              </li>
              <li>
                <a href="#catalog" className="hover:text-white transition-colors">
                  Browse All Datasets
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenTerms}
                  className="hover:text-blue-400 transition-colors text-slate-300 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Terms &amp; Conditions</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenPrivacyPolicy}
                  className="hover:text-blue-400 transition-colors text-slate-300 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button onClick={onOpenAdmin} className="hover:text-white transition-colors text-slate-400">
                  Store Owner Dashboard & Logs
                </button>
              </li>
            </ul>
          </div>

          {/* Support & Merchant Info */}
          <div className="space-y-2">
            <span className="font-semibold text-white block">Customer Support</span>
            <p className="text-[11px] text-slate-400">
              Need assistance with your purchased files or need a link re-issued?
            </p>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1">
              <a
                href="mailto:helpeasemymart@gmail.com"
                className="text-blue-400 hover:text-blue-300 font-mono transition-colors block"
              >
                helpeasemymart@gmail.com
              </a>
              <div className="text-slate-500 text-[10px]">Response time: &lt; 2 hours</div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} Research Dital Pro. All database files and repositories are protected.
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span>Powered by Razorpay Payments</span>
            <span>·</span>
            <button
              onClick={onOpenTerms}
              className="text-slate-400 hover:text-blue-400 underline transition-colors"
            >
              Terms &amp; Conditions
            </button>
            <span>·</span>
            <button
              onClick={onOpenPrivacyPolicy}
              className="text-slate-400 hover:text-blue-400 underline transition-colors"
            >
              Privacy Policy
            </button>
            <span>·</span>
            <span>256-bit Encrypted Token Authentication</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
