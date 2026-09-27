import Link from 'next/link';
import { Clock, CreditCard, EyeOff, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { BRAND_NAME } from '@/lib/constants';
import { getPriceSummary } from '@/data/products';
import { LegalSection, LegalTimeline, TrustCard } from '../ui/LegalSection';

/** Store settings the legal text depends on. Passed in so the text always matches real behaviour. */
export interface LegalFacts {
  supportEmail: string;
  expiryHours: number;
  maxDownloads: number;
}

export const LEGAL_LAST_UPDATED = 'September 2026';

const strong = 'text-slate-200 font-semibold';

function EmailLink({ email }: { email: string }) {
  return (
    <a href={`mailto:${email}`} className="text-blue-300 underline underline-offset-2 hover:text-blue-200 wrap-anywhere">
      {email}
    </a>
  );
}

function ContactBox({ email, title, text }: { email: string; title: string; text: string }) {
  return (
    <div className="p-4 rounded-2xl bg-slate-900/60 ring-1 ring-slate-800 space-y-1.5">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Mail className="w-4 h-4 text-blue-400" aria-hidden="true" />
        {title}
      </h3>
      <p className="text-slate-400">{text}</p>
      <EmailLink email={email} />
    </div>
  );
}

export function PrivacyContent({ supportEmail, expiryHours, maxDownloads }: LegalFacts) {
  return (
    <div className="space-y-7 text-sm text-slate-300 leading-relaxed">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TrustCard
          icon={<CreditCard className="w-3.5 h-3.5 text-emerald-400" />}
          title="Card details stay with Razorpay"
          text="We never see or store card numbers, UPI PINs or banking passwords."
        />
        <TrustCard
          icon={<EyeOff className="w-3.5 h-3.5 text-blue-400" />}
          title="We don't sell your data"
          text="Buyer information is not sold or shared with advertisers."
        />
        <TrustCard
          icon={<Clock className="w-3.5 h-3.5 text-amber-400" />}
          title="Time-limited links"
          text={`Download links expire after ${expiryHours} hours.`}
        />
      </div>

      <LegalTimeline>
        <LegalSection n={1} title="Information we collect">
          <p>When you buy from {BRAND_NAME}, we collect only what we need to deliver your files and support you:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className={strong}>Contact details:</span> your name, email address and (optionally) phone number, entered at
              checkout.
            </li>
            <li>
              <span className={strong}>Payment references:</span> the order ID, payment ID and amount that Razorpay returns to us.
              We do not receive card numbers, UPI PINs or net banking passwords.
            </li>
            <li>
              <span className={strong}>Download activity:</span> the IP address, time and browser details each time your download
              link is used.
            </li>
          </ul>
        </LegalSection>

        <LegalSection n={2} title="How we use it">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>To create your download pass and let you find it again later.</li>
            <li>To answer support requests and re-issue expired links.</li>
            <li>To keep a record of each transaction.</li>
            <li>To enforce download limits and detect misuse of download links.</li>
          </ul>
        </LegalSection>

        <LegalSection n={3} title="Payments">
          <p>
            Payments are processed by <span className={strong}>Razorpay</span>. You enter your payment details in Razorpay&apos;s
            own checkout window, and Razorpay handles them under its own privacy policy.
          </p>
        </LegalSection>

        <LegalSection n={4} title="Download links">
          <p>
            The location of our files is kept on our server. It is only released through your personal download link after your
            payment is confirmed. Each link works for <span className={strong}>{expiryHours} hours</span> or{' '}
            <span className={strong}>{maxDownloads} downloads</span>, whichever comes first. Email us if you need an expired link
            re-issued.
          </p>
        </LegalSection>

        <LegalSection n={5} title="Your choices">
          <p>
            You can ask us to show, correct or delete the information we hold about your purchase by emailing us. We may keep
            basic transaction records where we are required to for accounting.
          </p>
        </LegalSection>
      </LegalTimeline>

      <ContactBox email={supportEmail} title="Privacy questions" text="Write to us about privacy, your data or a refund:" />
    </div>
  );
}

export function TermsContent({ supportEmail, expiryHours, maxDownloads }: LegalFacts) {
  const prices = getPriceSummary();
  return (
    <div className="space-y-7 text-sm text-slate-300 leading-relaxed">
      <div className="relative overflow-hidden p-4 rounded-2xl bg-linear-to-br from-blue-950/70 via-slate-900 to-violet-950/50 ring-1 ring-blue-400/30 space-y-1.5">
        <h3 className="flex items-center gap-2 text-blue-300 font-semibold">
          <Clock className="w-4 h-4" aria-hidden="true" />
          24-hour delivery guarantee
        </h3>
        <p className="text-slate-300">
          If your payment went through but you did not get your download link, email us. We will check the payment and send you
          access within <span className={strong}>24 hours</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TrustCard icon={<Mail className="w-3.5 h-3.5 text-emerald-400" />} title="Email support" text={supportEmail} />
        <TrustCard
          icon={<RefreshCw className="w-3.5 h-3.5 text-blue-400" />}
          title="Free re-issue"
          text="Expired download links are re-issued on request."
        />
        <TrustCard
          icon={<ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
          title="Payments by Razorpay"
          text="Every order is backed by a Razorpay payment ID."
        />
      </div>

      <LegalTimeline>
        <LegalSection n={1} title="Agreement">
          <p>
            By browsing our catalog or buying any dataset from {BRAND_NAME}, you agree to these terms. If you do not agree, please
            do not use the site.
          </p>
        </LegalSection>

        <LegalSection n={2} highlight title="Paid but didn't get your link?">
          <p>
            Your download link appears on screen as soon as Razorpay confirms your payment. If the page closed or your connection
            dropped before that, your payment is still recorded.
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              Use <span className={strong}>Find my pass</span> on the{' '}
              <Link href="/access" className="text-blue-300 underline underline-offset-2">
                download pass page
              </Link>{' '}
              with your checkout email and Razorpay payment ID (for example <span className="font-mono">pay_XXXXXXXX</span>).
            </li>
            <li>
              Or email <EmailLink email={supportEmail} /> with your payment ID, the email you used at checkout and the dataset
              name. We will reply with your access within 24 hours.
            </li>
          </ul>
        </LegalSection>

        <LegalSection n={3} title="Delivery and link validity">
          <p>All products are digital files, delivered from our Google Drive storage through a personal download link.</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              Each link is valid for <span className={strong}>{expiryHours} hours</span> after purchase and allows up to{' '}
              <span className={strong}>{maxDownloads} downloads</span>.
            </li>
            <li>If your link expires before you finish downloading, we will issue a new one at no extra cost.</li>
          </ul>
        </LegalSection>

        <LegalSection n={4} title="Refunds">
          <p>
            Because files cannot be returned once downloaded, sales are final after delivery. Refunds are given if you were charged
            twice or if we cannot deliver. See the{' '}
            <Link href="/refund-policy" className="text-blue-300 underline underline-offset-2">
              refund policy
            </Link>{' '}
            for details.
          </p>
        </LegalSection>

        <LegalSection n={5} title="Permitted use">
          <p>Buying a dataset gives you a non-exclusive, non-transferable licence to use it for:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
            <div className="p-3 rounded-xl bg-emerald-500/5 ring-1 ring-emerald-500/25">
              <span className="text-emerald-300 font-semibold block mb-0.5">Allowed</span>
              Internal business intelligence, marketing analysis, prospecting, direct B2B/B2C outreach and market research.
            </div>
            <div className="p-3 rounded-xl bg-rose-500/5 ring-1 ring-rose-500/25">
              <span className="text-rose-300 font-semibold block mb-0.5">Not allowed</span>
              Reselling, sublicensing, publishing the data, or sharing the download or Drive links with anyone else.
            </div>
          </div>
        </LegalSection>

        <LegalSection n={6} title="Prices and payment">
          <p>
            All prices are in Indian Rupees (INR) and shown on each product. Datasets start at ₹{prices.standardFrom}, the US
            dataset is ₹{prices.us} and the complete bundle is ₹{prices.bundle}. Payment is taken by Razorpay using UPI, cards, net
            banking or wallets.
          </p>
        </LegalSection>
      </LegalTimeline>

      <ContactBox email={supportEmail} title="Questions about these terms" text="For payments, missing links or re-issues, email:" />
    </div>
  );
}

export function RefundContent({ supportEmail }: LegalFacts) {
  return (
    <div className="space-y-7 text-sm text-slate-300 leading-relaxed">
      <LegalTimeline>
        <LegalSection n={1} title="Digital products">
          <p>
            Our datasets are digital files. Once the files have been delivered and downloaded they cannot be returned, so the sale
            is final.
          </p>
        </LegalSection>
        <LegalSection n={2} title="Access problems">
          <p>
            If you cannot open the Google Drive folder, email us first. We will send an alternative link or deliver the files
            directly.
          </p>
        </LegalSection>
        <LegalSection n={3} highlight title="When you get a full refund">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You were charged more than once for the same order.</li>
            <li>We cannot deliver your files within 24 hours of your support email.</li>
          </ul>
          <p>Refunds go back to your original payment method through Razorpay. Your bank&apos;s processing time applies.</p>
        </LegalSection>
        <LegalSection n={4} title="How to ask for a refund">
          <p>
            Email <EmailLink email={supportEmail} /> with your Razorpay payment ID, the email you used at checkout and a short
            description of the problem.
          </p>
        </LegalSection>
      </LegalTimeline>
    </div>
  );
}

export function ContactContent({ supportEmail }: LegalFacts) {
  return (
    <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
      <div className="p-5 rounded-2xl bg-linear-to-br from-blue-950/60 to-slate-900 ring-1 ring-blue-400/25 space-y-2">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-400" aria-hidden="true" />
          Email support
        </h2>
        <a href={`mailto:${supportEmail}`} className="text-lg font-mono font-semibold text-blue-300 hover:text-blue-200 wrap-anywhere">
          {supportEmail}
        </a>
        <p className="text-slate-400">We resolve missing or expired download links within 24 hours of your email.</p>
      </div>
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-white">To help us find your order, include:</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Your Razorpay payment ID (starts with <span className="font-mono">pay_</span>)</li>
          <li>The email address you used at checkout</li>
          <li>The name of the dataset you bought</li>
        </ul>
      </div>
      <p>
        Lost your download link? You can often recover it yourself on the{' '}
        <Link href="/access" className="text-blue-300 underline underline-offset-2">
          download pass page
        </Link>{' '}
        using <span className={strong}>Find my pass</span>.
      </p>
    </div>
  );
}
