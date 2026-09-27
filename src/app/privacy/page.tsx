import type { Metadata } from 'next';
import { PrivacyContent } from '@/components/legal/LegalContent';
import { LegalPage, getLegalFacts } from '@/components/legal/LegalPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Research Digital Pro collects, uses and protects buyer information.',
  alternates: { canonical: '/privacy' },
};

export default function Page() {
  return (
    <LegalPage title="Privacy Policy" intro="What we collect when you buy, why we collect it, and how to reach us about it." current="/privacy">
      <PrivacyContent {...getLegalFacts()} />
    </LegalPage>
  );
}
