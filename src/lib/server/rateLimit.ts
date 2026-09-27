/**
 * Small in-memory fixed-window rate limiter, keyed per client (usually IP).
 * Good enough for a single server process. Behind several instances, use a shared store instead.
 */
type Bucket = { count: number; resetAt: number };

const globalBuckets = globalThis as unknown as { __rdpRateLimit?: Map<string, Bucket> };
const buckets = (globalBuckets.__rdpRateLimit ??= new Map<string, Bucket>());

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    return { ok: true, retryAfterSeconds: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  return { ok: true, retryAfterSeconds: 0 };
}
