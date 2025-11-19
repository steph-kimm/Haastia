import crypto from "crypto";

const MANAGE_TOKEN_BYTES = 32;
const MANAGE_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export const hashManageToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

export const generateManageTokenBundle = () => {
  const raw = crypto.randomBytes(MANAGE_TOKEN_BYTES).toString("hex");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + MANAGE_TOKEN_TTL_MS);
  return {
    raw,
    hashed: hashManageToken(raw),
    createdAt,
    expiresAt,
  };
};

export const buildManageBookingUrl = (token) => {
  const base = process.env.APP_BASE_URL;
  if (!base) return null;
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${normalizedBase}/bookings/manage/${token}`;
};
