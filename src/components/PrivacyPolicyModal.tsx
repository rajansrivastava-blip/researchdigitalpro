import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { ModalShell } from './ui/ModalShell';
import { LEGAL_LAST_UPDATED, PrivacyContent, type LegalFacts } from './legal/LegalContent';
import { BRAND_NAME } from '@/lib/constants';

export function PrivacyPolicyModal({ onClose, facts }: { onClose: () => void; facts: LegalFacts }) {
  return (
    <ModalShell
      onClose={onClose}
      accent="blue"
      size="lg"
      icon={<ShieldCheck className="w-5 h-5" />}
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle={`${BRAND_NAME} · Last updated ${LEGAL_LAST_UPDATED}`}
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <Link href="/privacy" onClick={onClose} className="text-slate-400 hover:text-white underline underline-offset-2">
            Open as a full page
          </Link>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-linear-to-r from-blue-600 to-indigo-500 text-white font-semibold shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 transition-all"
          >
            Close
          </button>
        </div>
      }
    >
      <PrivacyContent {...facts} />
    </ModalShell>
  );
}
