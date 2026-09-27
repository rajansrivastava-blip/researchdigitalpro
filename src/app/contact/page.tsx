import type { Metadata } from 'next';
import { ContactContent } from '@/components/legal/LegalContent';
import { LegalPage, getLegalFacts } from '@/components/legal/LegalPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Contact Research Digital Pro support for help with purchases and download links.',
  alternates: { canonical: '/contact' },
};

export default function Page() {
  return (
    <LegalPage title="Contact Us" intro="Get help with a purchase, a missing link or a re-issue." current="/contact">
      <ContactContent {...getLegalFacts()} />
    </LegalPage>
  );
}
