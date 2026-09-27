import type { Metadata } from 'next';
import { TermsContent } from '@/components/legal/LegalContent';
import { LegalPage, getLegalFacts } from '@/components/legal/LegalPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms for buying and using datasets from Research Digital Pro: delivery, download links, refunds and permitted use.',
  alternates: { canonical: '/terms' },
};

export default function Page() {
  return (
    <LegalPage title="Terms & Conditions" intro="The rules for buying and using datasets from Research Digital Pro." current="/terms">
      <TermsContent {...getLegalFacts()} />
    </LegalPage>
  );
}
