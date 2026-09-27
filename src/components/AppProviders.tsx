'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AccessDetails, StoreInfo } from '@/types';
import type { LegalFacts } from './legal/LegalContent';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { ReceiptModal } from './ReceiptModal';
import { TermsAndConditionsModal } from './TermsAndConditionsModal';

interface AppUI {
  storeInfo: StoreInfo;
  openPrivacyPolicy: () => void;
  openTerms: () => void;
  /** Loads the pass for `token` and shows its receipt. Resolves false if it could not be loaded. */
  openReceipt: (token: string) => Promise<boolean>;
}

const AppUIContext = createContext<AppUI | null>(null);

export function useAppUI(): AppUI {
  const ctx = useContext(AppUIContext);
  if (!ctx) throw new Error('useAppUI must be used inside <AppProviders>');
  return ctx;
}

/** Hosts the modals that can be opened from any page (legal text, receipt) and shares store settings. */
export function AppProviders({ storeInfo, children }: { storeInfo: StoreInfo; children: React.ReactNode }) {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [receipt, setReceipt] = useState<AccessDetails | null>(null);

  const openReceipt = useCallback(async (token: string) => {
    try {
      const res = await fetch(`/api/access/${encodeURIComponent(token)}`, { cache: 'no-store' });
      if (!res.ok) return false;
      setReceipt(await res.json());
      return true;
    } catch {
      return false;
    }
  }, []);

  const facts: LegalFacts = useMemo(
    () => ({
      supportEmail: storeInfo.supportEmail,
      expiryHours: storeInfo.tokenExpiryHours,
      maxDownloads: storeInfo.maxDownloadsPerToken,
    }),
    [storeInfo]
  );

  const value = useMemo<AppUI>(
    () => ({
      storeInfo,
      openPrivacyPolicy: () => setIsPrivacyOpen(true),
      openTerms: () => setIsTermsOpen(true),
      openReceipt,
    }),
    [storeInfo, openReceipt]
  );

  return (
    <AppUIContext.Provider value={value}>
      {children}
      {receipt && <ReceiptModal details={receipt} onClose={() => setReceipt(null)} />}
      {isPrivacyOpen && <PrivacyPolicyModal facts={facts} onClose={() => setIsPrivacyOpen(false)} />}
      {isTermsOpen && <TermsAndConditionsModal facts={facts} onClose={() => setIsTermsOpen(false)} />}
    </AppUIContext.Provider>
  );
}
