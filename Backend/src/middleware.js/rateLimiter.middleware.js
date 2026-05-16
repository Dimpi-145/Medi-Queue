const rateLimit = require("express-rate-limit");

// Rate limiter for auth endpoints (login, register)
// Exempt localhost during development to avoid accidental 429s when testing locally.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip limiter when not in production (local dev) or when request comes from localhost
    const isDev = process.env.NODE_ENV !== "production";
    const ip = req.ip || req.connection?.remoteAddress || "";
    const isLocalIp =
      ip === "127.0.0.1" || ip === "::1" || req.hostname === "localhost";
    return isDev || isLocalIp;
  },
});

// Rate limiter for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const isDev = process.env.NODE_ENV !== "production";
    const ip = req.ip || req.connection?.remoteAddress || "";
    const isLocalIp =
      ip === "127.0.0.1" || ip === "::1" || req.hostname === "localhost";
    return isDev || isLocalIp;
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};
