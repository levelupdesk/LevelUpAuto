import type { Request, RequestHandler } from "express";

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX = 5;
const PRUNE_THRESHOLD = 10_000;

type Bucket = {
  count: number;
  resetAt: number;
};

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];

  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `${name} must be a positive integer, received "${raw}".`,
    );
  }

  return value;
}

function clientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

export function createFixedWindowRateLimiter(options: {
  windowMs: number;
  max: number;
  errorMessage: string;
}): RequestHandler {
  const buckets = new Map<string, Bucket>();
  const { windowMs, max, errorMessage } = options;

  return (req, res, next) => {
    const now = Date.now();

    if (buckets.size >= PRUNE_THRESHOLD) {
      for (const [key, bucket] of buckets) {
        if (now >= bucket.resetAt) {
          buckets.delete(key);
        }
      }
    }

    const key = clientKey(req);
    let bucket = buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader(
      "RateLimit-Reset",
      String(Math.ceil(bucket.resetAt / 1000)),
    );

    if (bucket.count >= max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("RateLimit-Remaining", "0");
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({ error: errorMessage });
      return;
    }

    bucket.count += 1;
    res.setHeader("RateLimit-Remaining", String(max - bucket.count));
    next();
  };
}

export const contactRateLimit = createFixedWindowRateLimiter({
  windowMs: readPositiveInt(
    "CONTACT_RATE_LIMIT_WINDOW_MS",
    DEFAULT_WINDOW_MS,
  ),
  max: readPositiveInt("CONTACT_RATE_LIMIT_MAX", DEFAULT_MAX),
  errorMessage: "Too many contact submissions. Please try again later.",
});
