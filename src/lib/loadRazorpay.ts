'use client';

export interface RazorpayFailureResponse {
  error?: { code?: string; description?: string; reason?: string };
}

export interface RazorpayInstance {
  on(event: 'payment.failed', handler: (resp: RazorpayFailureResponse) => void): void;
  open(): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let loading: Promise<boolean> | null = null;

/**
 * Loads Razorpay Standard Checkout on demand, only when a customer opens checkout,
 * instead of on every page. Resolves false if the script is blocked or fails to load.
 */
export function loadRazorpayCheckout(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (typeof window.Razorpay === 'function') return Promise.resolve(true);
  if (!loading) {
    loading = new Promise<boolean>((resolve) => {
      const script = document.createElement('script');
      script.src = CHECKOUT_SRC;
      script.async = true;
      script.onload = () => resolve(typeof window.Razorpay === 'function');
      script.onerror = () => {
        loading = null; // allow a retry
        script.remove();
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}
