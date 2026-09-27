import Link from 'next/link';
import { FileCheck } from 'lucide-react';
import { ModalShell } from './ui/ModalShell';
import { LEGAL_LAST_UPDATED, TermsContent, type LegalFacts } from './legal/LegalContent';
import { BRAND_NAME } from '@/lib/constants';

export function TermsAndConditionsModal({ onClose, facts }: { onClose: () => void; facts: LegalFacts }) {
  return (
    <ModalShell
      onClose={onClose}
      accent="violet"
      size="lg"
      icon={<FileCheck className="w-5 h-5" />}
      eyebrow="Legal"
      title="Terms & Conditions"
      subtitle={`${BRAND_NAME} · Last updated ${LEGAL_LAST_UPDATED}`}
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <Link href="/terms" onClick={onClose} className="text-slate-400 hover:text-white underline underline-offset-2">
            Open as a full page
          </Link>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-linear-to-r from-violet-600 to-blue-600 text-white font-semibold shadow-lg shadow-violet-600/25 hover:shadow-violet-500/40 transition-all"
          >
            Close
          </button>
        </div>
      }
    >
      <TermsContent {...facts} />
    </ModalShell>
  );
}
