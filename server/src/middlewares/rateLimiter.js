const cache = {};

/**
 * Self-contained, memory-based rate limiting middleware.
 * Tracks client requests by IP address.
 * 
 * @param {Object} options Configuration parameters
 * @param {number} options.windowMs Time window in milliseconds (e.g. 15 minutes = 15 * 60 * 1000)
 * @param {number} options.max Maximum requests allowed in the time window
 */
export default function rateLimiter({ windowMs, max }) {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!cache[ip]) {
      cache[ip] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    const client = cache[ip];

    // If window expired, reset rate limit tracking
    if (now > client.resetTime) {
      client.count = 1;
      client.resetTime = now + windowMs;
      return next();
    }

    client.count++;

    if (client.count > max) {
      return res.status(429).json({
        success: false,
        data: null,
        error: 'Too many requests from this IP address. Please try again later.',
      });
    }

    next();
  };
}
