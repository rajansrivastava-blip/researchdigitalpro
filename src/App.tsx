import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { ProductCatalog } from './components/ProductCatalog.tsx';
import { SampleDataModal } from './components/SampleDataModal.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { SuccessReceiptModal } from './components/SuccessReceiptModal.tsx';
import { EmailSimulationModal } from './components/EmailSimulationModal.tsx';
import { AccessPortal } from './components/AccessPortal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { Footer } from './components/Footer.tsx';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal.tsx';
import { TermsAndConditionsModal } from './components/TermsAndConditionsModal.tsx';
import { Product, StoreInfo, AccessDetails } from './types.ts';
import { INITIAL_PRODUCTS } from './data/products.ts';
import { ShieldCheck, Sparkles } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>({
    supportEmail: 'helpeasemymart@gmail.com',
    tokenExpiryHours: 24,
    currency: 'INR',
    razorpayKeyId: '',
    isDemoMode: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any | null>(null);

  // Privacy Policy & Terms Modals
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Email Preview Modal
  const [emailPreviewDetails, setEmailPreviewDetails] = useState<AccessDetails | null>(null);

  // View Routing: 'store' | 'access' | 'admin'
  const [viewMode, setViewMode] = useState<'store' | 'access' | 'admin'>('store');
  const [adminInitialTab, setAdminInitialTab] = useState<'downloads' | 'settings'>('downloads');
  const [urlToken, setUrlToken] = useState<string>('');

  const handleOpenRazorpaySettings = () => {
    setAdminInitialTab('settings');
    setViewMode('admin');
  };

  // Check URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('reissue');
    if (token) {
      setUrlToken(token);
      setViewMode('access');
    }
  }, []);

  // Fetch product catalog from server
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
        if (data.storeInfo) {
          setStoreInfo(data.storeInfo);
        }
      }
    } catch (e) {
      console.warn('Using verified local product catalog:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenEmailPreview = async (token: string) => {
    try {
      const res = await fetch(`/api/access/${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        setEmailPreviewDetails(data);
      }
    } catch (e) {
      console.error('Failed to load email preview:', e);
    }
  };

  const handlePaymentSuccess = (result: any) => {
    setCheckoutProduct(null);
    setPaymentSuccessData(result);
  };

  const scrollToCatalog = () => {
    if (viewMode !== 'store') {
      setViewMode('store');
      setTimeout(() => {
        const el = document.getElementById('catalog');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('catalog');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-white">
      {/* Top Banner: User Pricing Highlight & Security Guarantee */}
      <div className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-300 py-1.5 px-4 text-center flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
        <span className="text-blue-400 font-mono font-semibold">Special Offer</span>
        <span>•</span>
        <span>US Database: <strong>₹79 INR</strong></span>
        <span>•</span>
        <span>All Other Datasets: <strong>₹49 INR</strong></span>
        <span>•</span>
        <span>VIP Master Bundle: <strong>₹249 INR</strong></span>
        <span>•</span>
        <span className="text-slate-400 hidden sm:inline">24h Encrypted Access Link · Razorpay Verified</span>
      </div>

      {/* Main Navbar */}
      <Navbar
        onGoHome={() => setViewMode('store')}
        onOpenAccessPortal={() => setViewMode('access')}
        onOpenAdmin={() => {
          setAdminInitialTab('downloads');
          setViewMode('admin');
        }}
        onOpenRazorpaySettings={handleOpenRazorpaySettings}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {viewMode === 'store' && (
          <>
            <Hero
              onScrollToCatalog={scrollToCatalog}
              onOpenAccessPortal={() => setViewMode('access')}
            />

            {isLoading && products.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-xs text-slate-400 font-mono">Loading digital products repository...</p>
              </div>
            ) : (
              <ProductCatalog
                products={products}
                onPreview={(prod) => setPreviewProduct(prod)}
                onBuyNow={(prod) => setCheckoutProduct(prod)}
              />
            )}
          </>
        )}

        {viewMode === 'access' && (
          <AccessPortal
            initialToken={urlToken}
            onBackToStore={() => setViewMode('store')}
            onOpenEmailPreview={handleOpenEmailPreview}
          />
        )}

        {viewMode === 'admin' && (
          <AdminDashboard
            initialTab={adminInitialTab}
            onClose={() => setViewMode('store')}
            onOpenEmailPreview={handleOpenEmailPreview}
          />
        )}
      </main>

      {/* Modals */}
      {/* 1. Sample Preview Modal */}
      {previewProduct && (
        <SampleDataModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
          onBuyNow={(prod) => setCheckoutProduct(prod)}
        />
      )}

      {/* 2. Razorpay Checkout Modal */}
      {checkoutProduct && (
        <CheckoutModal
          product={checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
          onSuccess={handlePaymentSuccess}
          onOpenPrivacyPolicy={() => setIsPrivacyModalOpen(true)}
          onOpenTerms={() => setIsTermsModalOpen(true)}
          onOpenAdmin={handleOpenRazorpaySettings}
        />
      )}

      {/* 3. Payment Success & Download Pass Modal */}
      {paymentSuccessData && (
        <SuccessReceiptModal
          paymentResult={paymentSuccessData}
          onClose={() => setPaymentSuccessData(null)}
          onOpenEmailPreview={(token) => handleOpenEmailPreview(token)}
        />
      )}

      {/* 4. Customer Email Preview Modal */}
      {emailPreviewDetails && (
        <EmailSimulationModal
          accessDetails={emailPreviewDetails}
          onClose={() => setEmailPreviewDetails(null)}
        />
      )}

      {/* 5. Privacy Policy Modal */}
      {isPrivacyModalOpen && (
        <PrivacyPolicyModal
          onClose={() => setIsPrivacyModalOpen(false)}
        />
      )}

      {/* 6. Terms & Conditions Modal */}
      {isTermsModalOpen && (
        <TermsAndConditionsModal
          onClose={() => setIsTermsModalOpen(false)}
        />
      )}

      {/* Footer */}
      <Footer
        onOpenAccessPortal={() => setViewMode('access')}
        onOpenAdmin={() => setViewMode('admin')}
        onOpenPrivacyPolicy={() => setIsPrivacyModalOpen(true)}
        onOpenTerms={() => setIsTermsModalOpen(true)}
      />
    </div>
  );
}
