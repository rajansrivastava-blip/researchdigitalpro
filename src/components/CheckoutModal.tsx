import React, { useState } from 'react';
import { X, ShieldCheck, Mail, User, Phone, CheckCircle2, AlertCircle, CreditCard, Sparkles, KeyRound } from 'lucide-react';
import { Product } from '../types.ts';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface CheckoutModalProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: (paymentResult: any) => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenTerms?: () => void;
  onOpenAdmin?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ 
  product, 
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
  const [simulatedMethod, setSimulatedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');

  if (!product) return null;

  const validateForm = () => {
    if (!customerEmail.trim() || !customerEmail.includes('@') || !customerEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address to receive your secure download link.');
      return false;
    }
    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
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
          customerPhone: customerPhone || '+919876543210',
        }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.error || 'Failed to initialize payment.');
      }

      const orderData = await orderRes.json();

      const isRealRazorpayKey =
        orderData.keyId &&
        orderData.keyId !== 'rzp_test_AiStudioStore2026' &&
        (orderData.keyId.startsWith('rzp_live_') || orderData.keyId.startsWith('rzp_test_'));

      // If real Razorpay key is configured and Razorpay script is present, trigger official Razorpay Standard Checkout popup!
      if (isRealRazorpayKey && typeof window.Razorpay === 'function') {
        const cleanPhone = (customerPhone || '').replace(/[^0-9]/g, '');
        const formattedPhone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'Research Dital Pro',
          description: `Access: ${product.title.substring(0, 40)}`,
          order_id: orderData.orderId && orderData.orderId.startsWith('order_') ? orderData.orderId : undefined,
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: formattedPhone || undefined,
          },
          theme: {
            color: '#2563eb',
          },
          handler: async function (response: any) {
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
          rzp.on('payment.failed', function (resp: any) {
            const desc = resp.error?.description || 'Transaction cancelled.';
            console.error('Razorpay payment failure details:', resp);
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
        } catch (rzpErr: any) {
          console.error('Error invoking Razorpay checkout:', rzpErr);
          setErrorMessage(`Razorpay window failed to open: ${rzpErr.message || 'Please check popup permissions.'}`);
          setIsProcessing(false);
          return;
        }
      }

      // Fallback sandbox/simulation path (when store owner hasn't pasted API keys yet)
      await handleSandboxVerification(orderData.orderId);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Payment initiation failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleSandboxVerification = async (orderId: string) => {
    // Generate simulated payment id
    const mockPaymentId = `pay_rzp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await verifyAndCompletePayment({
      razorpay_payment_id: mockPaymentId,
      razorpay_order_id: orderId,
      razorpay_signature: 'sandbox_verified_signature',
    });
  };

  const verifyAndCompletePayment = async (paymentDetails: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature?: string;
  }) => {
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

      const verifyData = await verifyRes.json();
      setIsProcessing(false);
      onSuccess(verifyData);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Failed to complete transaction.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Razorpay Secure Checkout</h3>
              <p className="text-[11px] text-slate-400">256-bit Encrypted Transaction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close checkout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Summary Strip */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
          <div className="truncate pr-4">
            <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-mono">Product</span>
            <span className="text-xs font-medium text-slate-200 truncate block">{product.title}</span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-mono">Total Due</span>
            <span className="text-lg font-bold text-blue-400">₹{product.price} <span className="text-[10px] text-slate-400 font-normal">INR</span></span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Razorpay Gateway Status Banner */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <KeyRound className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-slate-200 block text-xs">Razorpay Gateway Integration</span>
                <span className="text-[11px] text-slate-400">
                  Accepts UPI (GPay, PhonePe, Paytm, QR), Cards &amp; NetBanking.
                </span>
              </div>
            </div>
            {onOpenAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md transition-colors shrink-0"
              >
                Set API Keys
              </button>
            )}
          </div>

          {merchantNotice && (
            <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-600/50 text-amber-200 text-xs space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block text-amber-300">Razorpay Account Activation Required</span>
                  <p className="text-[11px] leading-relaxed text-amber-200/90">
                    Your Razorpay Live account is currently pending KYC verification or website approval at <strong className="text-white">dashboard.razorpay.com</strong>. Razorpay blocks live transactions until KYC is approved.
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-amber-900/50 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10px] text-amber-300/80">Want to test payments immediately?</span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://dashboard.razorpay.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-[11px] font-medium bg-amber-600/30 hover:bg-amber-600/50 text-amber-100 rounded border border-amber-500/40"
                  >
                    Open Razorpay ↗
                  </a>
                  {onOpenAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAdmin();
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded"
                    >
                      Use Test Key
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {errorMessage && !merchantNotice && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Rajan Srivastava"
              className="w-full px-3.5 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Address <span className="text-rose-400">*</span>
              </span>
              <span className="text-[10px] text-blue-400 font-mono">Time-limited link sent here</span>
            </label>
            <input
              type="email"
              required
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Your 24-hour secure download token link will be dispatched immediately to this email upon payment.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Mobile Phone <span className="text-slate-500 text-[10px]">(Optional for SMS receipt)</span>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Payment Method Selector */}
          <div className="pt-2">
            <span className="block text-xs font-medium text-slate-300 mb-2">Supported Payment Channels</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSimulatedMethod('upi')}
                className={`py-2 px-2.5 rounded-lg border text-center transition-all ${
                  simulatedMethod === 'upi'
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-300'
                }`}
              >
                <span className="text-[11px] font-semibold block">UPI & QR</span>
                <span className="text-[9px] text-slate-400">GPay, PhonePe, Paytm</span>
              </button>
              <button
                type="button"
                onClick={() => setSimulatedMethod('card')}
                className={`py-2 px-2.5 rounded-lg border text-center transition-all ${
                  simulatedMethod === 'card'
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-300'
                }`}
              >
                <span className="text-[11px] font-semibold block">Cards</span>
                <span className="text-[9px] text-slate-400">Visa, MC, RuPay</span>
              </button>
              <button
                type="button"
                onClick={() => setSimulatedMethod('netbanking')}
                className={`py-2 px-2.5 rounded-lg border text-center transition-all ${
                  simulatedMethod === 'netbanking'
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-300'
                }`}
              >
                <span className="text-[11px] font-semibold block">NetBanking</span>
                <span className="text-[9px] text-slate-400">All Indian Banks</span>
              </button>
            </div>
          </div>

          {/* Security Guarantee & Terms */}
          <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-300 font-medium block">Database Protected Until Payment</span>
                <span>The database download pass is generated after payment signature verification. If undelivered, email us for guaranteed 24h delivery.</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
              <span>By proceeding, you agree to:</span>
              <div className="flex items-center gap-2">
                {onOpenTerms && (
                  <button
                    type="button"
                    onClick={onOpenTerms}
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Terms &amp; Conditions
                  </button>
                )}
                {onOpenTerms && onOpenPrivacyPolicy && <span>·</span>}
                {onOpenPrivacyPolicy && (
                  <button
                    type="button"
                    onClick={onOpenPrivacyPolicy}
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Privacy Policy
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Price: <strong className="text-white">₹{product.price} INR</strong>
          </div>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleRazorpayPayment}
            className="px-6 py-2.5 text-xs font-semibold rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all flex items-center gap-2 transform active:scale-95"
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pay ₹{product.price} with Razorpay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
