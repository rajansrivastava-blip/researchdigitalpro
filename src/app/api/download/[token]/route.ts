import { NextResponse } from 'next/server';
import { escapeHtml, getClientIp, statusPage } from '@/lib/server/http';
import { findOrderByToken, loadConfig, updateOrder } from '@/lib/server/storage';

const bodyText = (html: string) =>
  `<p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">${html}</p>`;

/** Validates the pass, logs the download, then redirects to the hidden Drive link. */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const config = loadConfig();
  const support = escapeHtml(config.supportEmail);
  const order = findOrderByToken(token);

  if (!order) {
    return statusPage({
      status: 404,
      title: 'Access Token Invalid',
      icon: '🔒',
      heading: 'Invalid Access Link',
      bodyHtml: bodyText(
        'This download token was not found or has been revoked. Please check your purchase email receipt or contact support.'
      ),
      linkHref: '/',
      linkLabel: 'Return to Store',
    });
  }

  if (order.status === 'revoked') {
    return statusPage({
      status: 403,
      title: 'Access Revoked',
      icon: '⛔',
      heading: 'Access Revoked',
      headingColor: '#f87171',
      borderColor: '#ef4444',
      bodyHtml: bodyText(`This download link has been revoked by administration. If this is in error, contact ${support}.`),
      linkHref: '/',
      linkLabel: 'Back to Store',
    });
  }

  if (new Date(order.expiresAt).getTime() < Date.now()) {
    return statusPage({
      status: 410,
      title: 'Download Link Expired',
      icon: '⏱️',
      heading: 'Time-Limited Link Expired',
      headingColor: '#fbbf24',
      borderColor: '#f59e0b',
      bodyHtml:
        bodyText(
          `Security policy: This link was valid for ${config.tokenExpiryHours} hours following your purchase and has now expired to prevent unauthorized file distribution.`
        ) +
        `<p style="color: #64748b; font-size: 12px; margin-top: 12px;">Order ID: ${escapeHtml(order.orderId)} · Purchased by: ${escapeHtml(order.customerEmail)}</p>`,
      linkHref: `/access?token=${encodeURIComponent(order.token)}`,
      linkLabel: 'Request Renewal / Re-issue',
    });
  }

  if (order.downloadCount >= order.maxDownloads) {
    return statusPage({
      status: 429,
      title: 'Download Limit Exceeded',
      icon: '⚠️',
      heading: 'Max Downloads Reached',
      headingColor: '#fbbf24',
      borderColor: '#f59e0b',
      bodyHtml: bodyText(
        `You have reached the maximum allowed limit of ${order.maxDownloads} downloads for this access pass. If you need assistance, email ${support}.`
      ),
      linkHref: '/',
      linkLabel: 'Back to Store',
    });
  }

  const updated = updateOrder(token, (o) => {
    o.downloadCount += 1;
    o.downloadLogs.push({
      timestamp: new Date().toISOString(),
      ip: getClientIp(request),
      userAgent: (request.headers.get('user-agent') || 'Unknown Browser').slice(0, 300),
    });
  });

  const destination = updated?.hiddenTargetLink || config.masterDriveLink;
  if (!destination) {
    // Delivery link not configured yet. Undo the count so the customer does not lose a download.
    updateOrder(token, (o) => {
      o.downloadCount = Math.max(0, o.downloadCount - 1);
      o.downloadLogs.pop();
    });
    return statusPage({
      status: 503,
      title: 'Download temporarily unavailable',
      icon: '🛠️',
      heading: 'Your files are being prepared',
      headingColor: '#fbbf24',
      borderColor: '#f59e0b',
      bodyHtml: bodyText(`Your pass is valid, but the download is not available right now. Please email ${support} with your payment ID and we will send your files.`),
      linkHref: `/access?token=${encodeURIComponent(order.token)}`,
      linkLabel: 'Back to my pass',
    });
  }
  const response = NextResponse.redirect(destination, 302);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
