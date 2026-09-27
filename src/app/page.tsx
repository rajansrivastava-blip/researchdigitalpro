import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { StoreFront } from '@/components/StoreFront';
import { BRAND_NAME, SITE_URL } from '@/lib/constants';
import { getProducts, getStoreInfo } from '@/lib/server/catalog';
import { loadConfig } from '@/lib/server/storage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Structured data built only from the real catalog and store settings (no ratings, no invented fields). */
function structuredData(supportEmail: string) {
  const products = getProducts();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: BRAND_NAME,
        url: SITE_URL,
        email: supportEmail,
      },
      {
        '@type': 'ItemList',
        name: `${BRAND_NAME} datasets`,
        itemListElement: products.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Product',
            name: p.title,
            description: p.description,
            category: p.category,
            brand: { '@id': `${SITE_URL}/#organization` },
            offers: {
              '@type': 'Offer',
              price: p.price.toFixed(2),
              priceCurrency: p.currency,
              availability: 'https://schema.org/InStock',
              url: `${SITE_URL}/#catalog`,
            },
          },
        })),
      },
    ],
  };
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  // Links sent before the Next.js migration pointed to /?token=… or /?reissue=…
  const params = await searchParams;
  const legacyToken = first(params.token) || first(params.reissue);
  if (legacyToken) redirect(`/access?token=${encodeURIComponent(legacyToken)}`);

  const storeInfo = getStoreInfo(loadConfig());
  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(storeInfo.supportEmail)).replace(/</g, '\\u003c') }}
      />
      <StoreFront products={getProducts()} storeInfo={storeInfo} />
    </>
  );
}
