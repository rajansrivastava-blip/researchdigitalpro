import { NextResponse } from 'next/server';

export function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/** Parses a JSON body, returning an empty object for malformed or non-object input. */
export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function str(value: unknown, maxLength = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Client IP as reported by the browser side of the proxy chain. Informational only (download logs). */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Key for rate limiting. Uses the LAST X-Forwarded-For entry, which is the one added by your own
 * reverse proxy, so a client cannot dodge limits by sending a fake header. Deploy behind a proxy
 * that sets X-Forwarded-For (Nginx, Vercel, Render, etc.).
 */
export function getRateLimitKey(request: Request): string {
  const chain = request.headers.get('x-forwarded-for')?.split(',').map((s) => s.trim()).filter(Boolean);
  return chain?.[chain.length - 1] || request.headers.get('x-real-ip') || 'direct';
}

/**
 * Small standalone HTML page for the download endpoint's error states.
 * All dynamic values must already be escaped by the caller.
 */
export function statusPage(opts: {
  status: number;
  title: string;
  icon: string;
  heading: string;
  headingColor?: string;
  borderColor?: string;
  bodyHtml: string;
  linkHref: string;
  linkLabel: string;
}) {
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${opts.title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
  </head>
  <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
    <div style="background: #1e293b; padding: 32px; border-radius: 16px; max-width: 480px; text-align: center; border: 1px solid ${opts.borderColor || '#334155'};">
      <div style="font-size: 40px; margin-bottom: 16px;">${opts.icon}</div>
      <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0; color: ${opts.headingColor || '#f8fafc'};">${opts.heading}</h1>
      ${opts.bodyHtml}
      <a href="${opts.linkHref}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">${opts.linkLabel}</a>
    </div>
  </body>
</html>`;
  return new NextResponse(html, {
    status: opts.status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
