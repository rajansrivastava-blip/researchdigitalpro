import { ImageResponse } from 'next/og';
import { getPriceSummary } from '@/data/products';
import { BRAND_NAME } from '@/lib/constants';

export const alt = `${BRAND_NAME}: B2B and consumer contact datasets`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Social preview image, generated from the brand name and real catalog prices. */
export default function OpengraphImage() {
  const prices = getPriceSummary();
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 55%, #1e3a8a 100%)',
          color: '#f8fafc',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: '#2563eb', display: 'flex' }} />
          <div style={{ fontSize: 36, fontWeight: 800 }}>{BRAND_NAME}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 900, lineHeight: 1.05, maxWidth: 950 }}>
            Business and consumer contact data, ready to download
          </div>
          <div style={{ fontSize: 30, color: '#93c5fd' }}>
            CSV / XLSX · Razorpay checkout · Instant private download link
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 28, color: '#cbd5e1' }}>
          <span>Datasets from ₹{prices.standardFrom}</span>
          <span>·</span>
          <span>US data ₹{prices.us}</span>
          <span>·</span>
          <span>Complete bundle ₹{prices.bundle}</span>
        </div>
      </div>
    ),
    size
  );
}
