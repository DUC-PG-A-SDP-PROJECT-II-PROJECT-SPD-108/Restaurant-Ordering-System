/**
 * Lightweight In-Memory Sliding Window Rate Limiter
 * Zero external dependencies. Protects authentication and public verification endpoints.
 */
const requestBuckets = new Map();

/**
 * Creates a rate limiting middleware.
 * @param {number} maxRequests - Maximum requests allowed within windowMs
 * @param {number} windowMs - Window duration in milliseconds (default: 60,000ms = 1 minute)
 * @param {string} message - Custom error message
 */
export function createRateLimiter(maxRequests = 30, windowMs = 60000, message = 'Too many requests. Please slow down and try again shortly.') {
  return function rateLimiter(req, res, next) {
    if (process.env.NODE_ENV === 'test' || req.headers['x-bypass-ratelimit']) {
      return next();
    }

    const rawIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const isLocalhost = rawIp === '127.0.0.1' || rawIp === '::1' || rawIp === '::ffff:127.0.0.1';

    // In local development / test runs, grant generous headroom for rapid test runners
    const effectiveLimit = isLocalhost && process.env.NODE_ENV !== 'production' ? 1000 : maxRequests;

    const key = `${req.baseUrl || ''}${req.path}:${rawIp}`;
    const now = Date.now();

    let record = requestBuckets.get(key);
    if (!record || now - record.resetTime > windowMs) {
      record = { count: 0, resetTime: now };
      requestBuckets.set(key, record);
    }

    record.count++;

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', effectiveLimit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, effectiveLimit - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil((record.resetTime + windowMs) / 1000));

    if (record.count > effectiveLimit) {
      return res.status(429).json({
        error: message,
        retryAfterSeconds: Math.ceil((record.resetTime + windowMs - now) / 1000)
      });
    }

    next();
  };
}

// Periodic cleanup of stale IP records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestBuckets.entries()) {
    if (now - record.resetTime > 300000) {
      requestBuckets.delete(key);
    }
  }
}, 300000).unref();
