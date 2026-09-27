import "server-only";

/**
 * Per-visitor rate limiting, in memory.
 *
 * Deliberately not Redis. This costs nothing, stops one visitor running up an
 * API bill, and the only thing a distributed limit would add is correctness
 * across instances — which matters at a scale NN has not reached. When it does,
 * swap the map for Upstash and keep the same signature.
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();
const SWEEP_AT = 5000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (buckets.size > SWEEP_AT) {
    for (const [k, v] of buckets) {
      if (!v.hits.some((t) => now - t < windowMs)) buckets.delete(k);
    }
  }

  if (bucket.hits.length >= max) {
    buckets.set(key, bucket);
    const oldest = bucket.hits[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { allowed: true, remaining: max - bucket.hits.length, retryAfterSeconds: 0 };
}

/** A stable, non-identifying key for a visitor. */
export function visitorKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "anonymous").trim();
}
