// controllers/stripeController.js
import Stripe from "stripe";
import PendingSignup from "../models/pendingSignup.js";
import User from "../models/user.js";
import { hashPassword } from "../helpers/auth.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SUBSCRIPTION_PRICE_ID =
  process.env.STRIPE_SUBSCRIPTION_PRICE_ID || "price_12345abc";

const appendSessionIdPlaceholder = (baseUrl = "") => {
  const trimmed = baseUrl.trim();
  return trimmed.includes("?")
    ? `${trimmed}&session_id={CHECKOUT_SESSION_ID}`
    : `${trimmed}?session_id={CHECKOUT_SESSION_ID}`;
};

const ensureValidUrl = (candidate, label) => {
  try {
    // Throws if invalid URL
    // eslint-disable-next-line no-new
    new URL(candidate);
    return null;
  } catch (err) {
    return `${label} must be a valid URL`;
  }
};

export const createCheckoutSession = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      location,
      isProvider,
      availability,
      successUrl,
      cancelUrl,
    } = req.body;

    // Validate signup payload before contacting Stripe
    if (!name) return res.status(400).json({ error: "Name is required" });
    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }
    if (!successUrl) {
      return res.status(400).json({ error: "successUrl is required" });
    }
    if (!cancelUrl) {
      return res.status(400).json({ error: "cancelUrl is required" });
    }

    const successUrlError = ensureValidUrl(successUrl, "successUrl");
    if (successUrlError) {
      return res.status(400).json({ error: successUrlError });
    }
    const cancelUrlError = ensureValidUrl(cancelUrl, "cancelUrl");
    if (cancelUrlError) {
      return res.status(400).json({ error: cancelUrlError });
    }

    const normalizedEmail = email.toLowerCase();

    // Prevent duplicate signups for already-registered users
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already in use" });
    }

    // Avoid creating multiple pending signups for same email
    const existingPending = await PendingSignup.findOne({ email: normalizedEmail });
    if (existingPending) {
      return res
        .status(400)
        .json({ error: "A pending signup already exists for this email" });
    }

    // Securely hash the password before storing
    const hashedPassword = await hashPassword(password);

    const role = isProvider ? "professional" : "customer";

    // Persist pending signup details while payment is processed
    const pendingSignup = await PendingSignup.create({
      name,
      email: normalizedEmail,
      hashedPassword,
      location,
      role,
      isProvider: Boolean(isProvider),
      availability: Array.isArray(availability) ? availability : [],
    });

    // Create Stripe Checkout session that references the pending signup metadata
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: SUBSCRIPTION_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        pendingSignupId: pendingSignup._id.toString(),
      },
      success_url: appendSessionIdPlaceholder(successUrl),
      cancel_url: appendSessionIdPlaceholder(cancelUrl),
    });

    // Store the Stripe session ID on the pending signup for later verification
    pendingSignup.sessionId = session.id;
    await pendingSignup.save();

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe session creation failed:", err.message);
    return res.status(500).json({ error: "Unable to create checkout session" });
  }
};
