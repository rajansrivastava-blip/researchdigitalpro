'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PaymentResult, Product, StoreInfo } from '@/types';
import { CheckoutModal } from './CheckoutModal';
import { Hero } from './Hero';
import { ProductCatalog } from './ProductCatalog';
import { SampleDataModal } from './SampleDataModal';
import { SuccessReceiptModal } from './SuccessReceiptModal';
import { useAppUI } from './AppProviders';

interface StoreFrontProps {
  products: Product[];
  storeInfo: StoreInfo;
}

export function StoreFront({ products, storeInfo }: StoreFrontProps) {
  const router = useRouter();
  const { openPrivacyPolicy, openTerms, openReceipt } = useAppUI();
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  return (
    <>
      <Hero />

      <ProductCatalog
        products={products}
        onPreview={(product) => setPreviewProduct(product)}
        onBuyNow={(product) => setCheckoutProduct(product)}
      />

      {previewProduct && (
        <SampleDataModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
          onBuyNow={(product) => setCheckoutProduct(product)}
        />
      )}

      {checkoutProduct && (
        <CheckoutModal
          product={checkoutProduct}
          storeInfo={storeInfo}
          onClose={() => setCheckoutProduct(null)}
          onSuccess={(result) => {
            setCheckoutProduct(null);
            setPaymentResult(result);
          }}
          onOpenPrivacyPolicy={openPrivacyPolicy}
          onOpenTerms={openTerms}
          onOpenAdmin={() => router.push('/admin?tab=settings')}
        />
      )}

      {paymentResult && (
        <SuccessReceiptModal
          paymentResult={paymentResult}
          supportEmail={storeInfo.supportEmail}
          onClose={() => setPaymentResult(null)}
          onOpenReceipt={openReceipt}
        />
      )}
    </>
  );
}
