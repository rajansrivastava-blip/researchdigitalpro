import type { Metadata } from 'next';
import { RefundContent } from '@/components/legal/LegalContent';
import { LegalPage, getLegalFacts } from '@/components/legal/LegalPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Refund and cancellation policy for digital datasets bought from Research Digital Pro.',
  alternates: { canonical: '/refund-policy' },
};

export default function Page() {
  return (
    <LegalPage title="Refund Policy" intro="When refunds are given for digital datasets and how to request one." current="/refund-policy">
      <RefundContent {...getLegalFacts()} />
    </LegalPage>
  );
}
