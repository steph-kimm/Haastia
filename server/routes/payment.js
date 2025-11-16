import express from "express";
import {
  createCheckoutSession,
  createExpressAccountLink,
  getStripeAccountStatus,
  createStripeLoginLink,
  createServiceBookingIntent,
  handleStripeWebhook,
} from "../controllers/payment.js";
import { requireSignin } from "../middlewares/auth.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";

const router = express.Router();

const ensureProfessional = (req, res, next) => {
  if (req.user?.role !== "professional") {
    return res
      .status(403)
      .json({ error: "This Stripe route is restricted to professionals" });
  }
  return next();
};

// POST /api/stripe/create-checkout-session
router.post("/create-checkout-session", createCheckoutSession);

// POST /api/payment/service-booking-intent
// Optional auth since guests can book, but JWT is honored when present.
router.post(
  "/service-booking-intent",
  optionalAuth,
  createServiceBookingIntent,
);

// POST /api/payment/webhook - Stripe sends events here, no auth header.
router.post("/webhook", handleStripeWebhook);

router.post(
  "/connect/account-link",
  requireSignin,
  ensureProfessional,
  createExpressAccountLink,
);

router.get(
  "/connect/account-status",
  requireSignin,
  ensureProfessional,
  getStripeAccountStatus,
);

router.post(
  "/connect/login-link",
  requireSignin,
  ensureProfessional,
  createStripeLoginLink,
);

export default router;
