'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Mail,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  KeyRound,
  QrCode,
  Landmark,
  Lock,
  Clock,
  Download,
  Check,
  Loader2,
} from 'lucide-react';
import type { PaymentResult, Product, StoreInfo } from '@/types';
import { BRAND_NAME, isValidEmail } from '@/lib/constants';
import { loadRazorpayCheckout } from '@/lib/loadRazorpay';
import { ModalShell } from './ui/ModalShell';

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  isConfigured: boolean;
}

interface CheckoutModalProps {
  product: Product | null;
  storeInfo: StoreInfo;
  onClose: () => void;
  onSuccess: (paymentResult: PaymentResult) => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenTerms?: () => void;
  onOpenAdmin?: () => void;
}

type PayMethod = 'upi' | 'card' | 'netbanking';

const PAY_METHODS: { id: PayMethod; label: string; hint: string; Icon: typeof QrCode }[] = [
  { id: 'upi', label: 'UPI & QR', hint: 'GPay · PhonePe · Paytm', Icon: QrCode },
  { id: 'card', label: 'Cards', hint: 'Visa · MC · RuPay', Icon: CreditCard },
  { id: 'netbanking', label: 'NetBanking', hint: 'All Indian banks', Icon: Landmark },
];

/** Text input with an icon inside the field and a glowing focus ring. */
function Field({
  id,
  label,
  icon,
  required,
  hint,
  aside,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  icon: React.ReactNode;
  hint?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-xs font-medium text-slate-300">
          {label} {required ? <span className="text-rose-400">*</span> : <span className="text-slate-400 text-xs">(optional)</span>}
        </label>
        {aside}
      </div>
      <div className="group relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
          {icon}
        </span>
        <input
          id={id}
          required={required}
          {...input}
          className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-900/80 ring-1 ring-slate-800 text-slate-100 placeholder:text-slate-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/70 focus:bg-slate-900 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
        />
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1.5">{hint}</p>}
    </div>
  );
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  product,
  storeInfo,
  onClose,
  onSuccess,
  onOpenPrivacyPolicy,
  onOpenTerms,
  onOpenAdmin,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [merchantNotice, setMerchantNotice] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<PayMethod>('upi');

  // Start loading Razorpay's script as soon as checkout opens, so the popup is ready on "Pay".
  useEffect(() => {
    if (storeInfo.isConfigured) loadRazorpayCheckout();
  }, [storeInfo.isConfigured]);

  if (!product) return null;

  const validateForm = () => {
    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return false;
    }
    if (!isValidEmail(customerEmail)) {
      setErrorMessage('Please enter a valid email address to receive your secure download link.');
      return false;
    }
    setErrorMessage(null);
    setMerchantNotice(null);
    return true;
  };

  const handleRazorpayPayment = async () => {
    if (!validateForm()) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setMerchantNotice(null);

    try {
      // 1. Create order on backend
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          customerName,
          customerEmail,
          customerPhone,
        }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.error || 'Failed to initialize payment.');
      }

      const orderData: CreateOrderResponse = await orderRes.json();

      // Real gateway: open the official Razorpay Standard Checkout popup.
      if (orderData.isConfigured) {
        const ready = await loadRazorpayCheckout();
        if (!ready || typeof window.Razorpay !== 'function') {
          setErrorMessage(
            'The Razorpay payment window could not load. Check your connection, turn off any ad or script blocker for this site, and try again.'
          );
          setIsProcessing(false);
          return;
        }

        const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
        const formattedPhone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: BRAND_NAME,
          description: `Access: ${product.title.substring(0, 40)}`,
          order_id: orderData.orderId,
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: formattedPhone || undefined,
            method: payMethod,
          },
          theme: {
            color: '#2563eb',
          },
          handler: async function (response: RazorpaySuccessResponse) {
            await verifyAndCompletePayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id || orderData.orderId,
              razorpay_signature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        try {
          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (resp) {
            const desc = resp.error?.description || 'Transaction cancelled.';
            if (
              desc.toLowerCase().includes('merchant') ||
              resp.error?.code === 'BAD_REQUEST_ERROR' ||
              resp.error?.reason === 'payment_failed'
            ) {
              setMerchantNotice(
                'Razorpay Account Alert: Your Razorpay Live account is currently pending KYC activation or website approval in dashboard.razorpay.com. To test payments right away without waiting, switch to Test Mode (rzp_test_...) in your Razorpay Dashboard.'
              );
            }
            setErrorMessage(`Payment failed: ${desc}`);
            setIsProcessing(false);
          });
          rzp.open();
          return;
        } catch (rzpErr) {
          console.error('Error invoking Razorpay checkout:', rzpErr);
          const msg = rzpErr instanceof Error ? rzpErr.message : 'Please check popup permissions.';
          setErrorMessage(`Razorpay window failed to open: ${msg}`);
          setIsProcessing(false);
          return;
        }
      }

      // Sandbox path: the store owner has not added Razorpay keys yet (development only by default).
      // The server issues a simulated payment; no real money moves.
      await verifyAndCompletePayment({});
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Payment initiation failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const verifyAndCompletePayment = async (paymentDetails: Partial<RazorpaySuccessResponse>) => {
    try {
      const verifyRes = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentDetails,
          productId: product.id,
          customerName,
          customerEmail,
          customerPhone,
        }),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.error || 'Payment verification failed.');
      }

      const verifyData: PaymentResult = await verifyRes.json();
      setIsProcessing(false);
      onSuccess(verifyData);
    } catch (err) {
      setIsProcessing(false);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to complete transaction.');
    }
  };

  const openAdmin = onOpenAdmin
    ? () => {
        onClose();
        onOpenAdmin();
      }
    : undefined;

  const discountPct =
    product.originalPrice > product.price ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  const detailsDone = customerName.trim().length > 0 && isValidEmail(customerEmail);
  const step = isProcessing ? 2 : detailsDone ? 2 : 1;
  const steps = ['Your details', 'Pay securely', 'Instant download'];

  return (
    <ModalShell
      onClose={onClose}
      closeLabel="Close checkout"
      accent="blue"
      size="xl"
      flush
      icon={<ShieldCheck className="w-5 h-5" />}
      eyebrow="Payments by Razorpay"
      title="Secure Checkout"
      subtitle="Your download link appears as soon as Razorpay confirms your payment."
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              By paying you agree to the{' '}
              {onOpenTerms ? (
                <button type="button" onClick={onOpenTerms} className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                  Terms
                </button>
              ) : (
                'Terms'
              )}{' '}
              &amp;{' '}
              {onOpenPrivacyPolicy ? (
                <button
                  type="button"
                  onClick={onOpenPrivacyPolicy}
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
                >
                  Privacy Policy
                </button>
              ) : (
                'Privacy Policy'
              )}
            </span>
          </div>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleRazorpayPayment}
            className="group relative overflow-hidden w-full sm:w-auto px-7 py-3 text-sm font-bold rounded-xl text-white bg-linear-to-r from-blue-600 via-blue-500 to-indigo-500 shadow-lg shadow-blue-600/30 ring-1 ring-white/10 hover:shadow-blue-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg] bg-white/20 blur-sm transition-transform duration-700 group-hover:translate-x-[300%]"
            />
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing payment…</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Pay ₹{product.price} securely</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ── Order summary panel ── */}
        <aside className="relative p-5 sm:p-6 md:border-r border-b md:border-b-0 border-white/5 bg-linear-to-b from-blue-950/40 via-slate-950 to-slate-950 overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-indigo-600/15 blur-3xl" />
          <div className="relative space-y-4 md:space-y-5">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-slate-400 bg-white/5 ring-1 ring-white/10 px-2 py-0.5 rounded-full">
                {product.category}
              </span>
              <h3 className="mt-2.5 text-base font-bold text-white leading-snug">{product.title}</h3>
              <p className="mt-1 text-[11px] font-mono text-slate-400">
                {product.recordCount} · {product.fileFormat} · {product.fileSize}
              </p>
            </div>

            {/* Price ticket */}
            <div className="relative rounded-2xl bg-slate-900/80 ring-1 ring-white/10 p-4">
              <span aria-hidden="true" className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-950 ring-1 ring-white/10" />
              <span aria-hidden="true" className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-950 ring-1 ring-white/10" />
              <div className="flex items-end justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">Total due</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-br from-white to-blue-300 tracking-tight">
                      ₹{product.price}
                    </span>
                    <span className="text-xs font-mono text-slate-400">INR</span>
                  </div>
                </div>
                {discountPct > 0 && (
                  <div className="text-right">
                    <span className="block text-xs text-slate-400 line-through">₹{product.originalPrice}</span>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[11px] font-bold ring-1 ring-emerald-400/30">
                      {discountPct}% OFF
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-dashed border-slate-700/80 text-[11px] text-slate-400">
                One-time payment · no subscription
              </div>
            </div>

            {/* What you get (desktop only, keeps the form above the fold on phones) */}
            <ul className="hidden md:block space-y-2">
              {product.highlights.slice(0, 3).map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-blue-500/15 ring-1 ring-blue-400/30 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-blue-300" />
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            {/* Trust row */}
            <div className="hidden md:grid grid-cols-3 gap-2 text-center">
              {[
                { Icon: ShieldCheck, label: 'Paid via Razorpay' },
                { Icon: Clock, label: `${storeInfo.tokenExpiryHours}h download link` },
                { Icon: Download, label: `${storeInfo.maxDownloadsPerToken} downloads` },
              ].map(({ Icon, label }) => (
                <div key={label} className="rounded-xl bg-white/3 ring-1 ring-white/5 px-1.5 py-2.5">
                  <Icon className="w-4 h-4 mx-auto text-slate-400" />
                  <span className="block mt-1 text-[11px] leading-tight text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Form panel ── */}
        <form
          className="p-5 sm:p-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleRazorpayPayment();
          }}
        >
          {/* Stepper */}
          <ol className="flex items-center gap-2" aria-label="Checkout progress">
            {steps.map((label, i) => {
              const n = i + 1;
              const done = n < step;
              const current = n === step;
              return (
                <li key={label} className="flex items-center gap-2 flex-1 last:flex-none">
                  <span
                    className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ring-1 transition-colors ${
                      done
                        ? 'bg-emerald-500 text-slate-950 ring-emerald-400'
                        : current
                          ? 'bg-blue-500/20 text-blue-200 ring-blue-400/60 shadow-[0_0_12px_rgba(59,130,246,0.45)]'
                          : 'bg-slate-900 text-slate-400 ring-slate-700'
                    }`}
                    aria-current={current ? 'step' : undefined}
                  >
                    {done ? <Check className="w-3 h-3" /> : n}
                  </span>
                  <span className={`text-[11px] whitespace-nowrap hidden sm:inline ${current ? 'text-white font-medium' : 'text-slate-400'}`}>
                    {label}
                  </span>
                  {n < steps.length && (
                    <span className={`h-px flex-1 min-w-3 ${done ? 'bg-emerald-500/60' : 'bg-slate-800'}`} aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ol>

          {storeInfo.sandboxAllowed && (
            <div className="p-3 rounded-xl bg-amber-500/10 ring-1 ring-amber-400/30 text-amber-100 text-[11px] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="text-amber-200">Test mode:</strong> Razorpay keys are not configured, so this checkout issues
                a simulated pass and no real payment is taken.
                {openAdmin && (
                  <button type="button" onClick={openAdmin} className="ml-1 inline-flex items-center gap-1 font-semibold text-amber-200 underline underline-offset-2">
                    <KeyRound className="w-3 h-3" /> Set API keys
                  </button>
                )}
              </div>
            </div>
          )}

          {merchantNotice && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 ring-1 ring-amber-600/50 text-amber-200 text-xs space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block text-amber-300">Razorpay Account Activation Required</span>
                  <p className="text-[11px] leading-relaxed text-amber-200/90">
                    Your Razorpay Live account is currently pending KYC verification or website approval at{' '}
                    <strong className="text-white">dashboard.razorpay.com</strong>. Razorpay blocks live transactions until KYC is
                    approved.
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-amber-900/50 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] text-amber-300/80">Want to test payments immediately?</span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://dashboard.razorpay.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-[11px] font-medium bg-amber-600/30 hover:bg-amber-600/50 text-amber-100 rounded-lg ring-1 ring-amber-500/40"
                  >
                    Open Razorpay ↗
                  </a>
                  {openAdmin && (
                    <button
                      type="button"
                      onClick={openAdmin}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                    >
                      Use Test Key
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {errorMessage && !merchantNotice && (
            <div role="alert" className="p-3 rounded-xl bg-rose-500/10 ring-1 ring-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              id="checkout-name"
              label="Full name"
              required
              icon={<User className="w-4 h-4" />}
              type="text"
              autoComplete="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Rajan Srivastava"
            />
            <Field
              id="checkout-phone"
              label="Mobile"
              icon={<Phone className="w-4 h-4" />}
              type="tel"
              autoComplete="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>

          <Field
            id="checkout-email"
            label="Email address"
            required
            icon={<Mail className="w-4 h-4" />}
            type="email"
            autoComplete="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="name@example.com"
            hint="We use this to find your purchase if you lose your download link."
          />

          {/* Payment method cards */}
          <fieldset>
            <legend className="text-xs font-medium text-slate-300 mb-2">Pay with</legend>
            <div className="grid grid-cols-3 gap-2.5">
              {PAY_METHODS.map(({ id, label, hint, Icon }) => {
                const selected = payMethod === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPayMethod(id)}
                    aria-pressed={selected}
                    className={`relative rounded-2xl p-3 text-left transition-all ring-1 ${
                      selected
                        ? 'bg-linear-to-br from-blue-500/20 to-indigo-500/5 ring-blue-400/70 shadow-[0_0_20px_-6px_rgba(59,130,246,0.6)]'
                        : 'bg-slate-900/60 ring-slate-800 hover:ring-slate-600'
                    }`}
                  >
                    {selected && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                    <Icon className={`w-5 h-5 ${selected ? 'text-blue-300' : 'text-slate-400'}`} />
                    <span className={`block mt-2 text-xs font-semibold ${selected ? 'text-white' : 'text-slate-300'}`}>{label}</span>
                    <span className="block text-xs text-slate-400 leading-tight mt-0.5">{hint}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/5 ring-1 ring-emerald-500/20 p-3 text-[11px] text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <span className="text-slate-200 font-medium">Files are released only after payment.</span> If your payment goes
              through but the link does not appear, email us and we will send your access within 24 hours.
            </span>
          </div>

          {/* Enter key submits */}
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>
      </div>
    </ModalShell>
  );
};
