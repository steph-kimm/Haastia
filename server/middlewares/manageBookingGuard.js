const windowMs = 5 * 60 * 1000; // 5 minutes
const maxRequests = 20;
const attempts = new Map();

const cleanupEntry = (key, expiresAt) => {
  const delay = Math.max(0, expiresAt - Date.now());
  setTimeout(() => {
    const entry = attempts.get(key);
    if (entry && entry.expiresAt === expiresAt) {
      attempts.delete(key);
    }
  }, delay);
};

export const manageBookingRateLimit = (req, res, next) => {
  const key = `${req.ip}:${req.baseUrl}`;
  const now = Date.now();
  let entry = attempts.get(key);

  if (!entry || entry.expiresAt <= now) {
    entry = { count: 0, expiresAt: now + windowMs };
    attempts.set(key, entry);
    cleanupEntry(key, entry.expiresAt);
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  next();
};

export const logManageBookingRequest = (req, _res, next) => {
  console.info(
    `[booking-manage] ${req.method} ${req.originalUrl} ip=${req.ip} user-agent=${req.get("user-agent") || "unknown"}`,
  );
  next();
};
