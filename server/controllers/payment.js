// controllers/stripeController.js
import Stripe from "stripe";
import PendingSignup from "../models/pendingSignup.js";
import User from "../models/user.js";
import { hashPassword } from "../helpers/auth.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SUBSCRIPTION_PRICE_ID =
  process.env.STRIPE_SUBSCRIPTION_PRICE_ID || "price_1SQHPq2KTn444Cl1CHYtqYqf";

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
      pendingSignupId,
    } = req.body;

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

    let pendingSignup;

    if (pendingSignupId) {
      pendingSignup = await PendingSignup.findById(pendingSignupId);
      if (!pendingSignup) {
        return res
          .status(404)
          .json({ error: "Pending signup not found. Please start over." });
      }
      if (pendingSignup.role !== "professional") {
        return res
          .status(400)
          .json({ error: "Checkout is only required for professional accounts." });
      }
    } else {
      // Validate signup payload before contacting Stripe when creating a new pending record
      if (!name) return res.status(400).json({ error: "Name is required" });
      if (!email) return res.status(400).json({ error: "Email is required" });

      if (!isProvider) {
        return res
          .status(200)
          .json({
            message: "Checkout is not required for non-professional accounts.",
          });
      }

      if (!password || password.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters long" });
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

      pendingSignup = await PendingSignup.create({
        name,
        email: normalizedEmail,
        hashedPassword,
        location,
        role: "professional",
        isProvider: true,
        availability: Array.isArray(availability) ? availability : [],
      });
    }

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

    return res.status(200).json({
      url: session.url,
      sessionId: session.id,
      pendingSignupId: pendingSignup._id.toString(),
    });
  } catch (err) {
    console.error("Stripe session creation failed:", err.message);
    return res.status(500).json({ error: "Unable to create checkout session" });
  }
};

const ensureProfessionalUser = async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    return { errorResponse: res.status(401).json({ error: "Authentication required" }) };
  }

  const user = await User.findById(userId);
  if (!user) {
    return { errorResponse: res.status(404).json({ error: "User not found" }) };
  }

  if (user.role !== "professional") {
    return {
      errorResponse: res
        .status(403)
        .json({ error: "Stripe Connect is only available to professionals" }),
    };
  }

  return { user };
};

const ensureAccountCapabilities = async (accountId) => {
  const desiredCapabilities = {
    card_payments: { requested: true },
    transfers: { requested: true },
  };

  await stripe.accounts.update(accountId, {
    capabilities: desiredCapabilities,
  });

  return stripe.accounts.retrieve(accountId);
};

const buildConnectUrls = () => {
  const refreshUrl = process.env.STRIPE_CONNECT_REFRESH_URL;
  const returnUrl = process.env.STRIPE_CONNECT_RETURN_URL;

  if (!refreshUrl || !returnUrl) {
    throw new Error("Stripe Connect URLs are not configured");
  }

  return { refreshUrl, returnUrl };
};

const mapAccountToStatus = (account) => ({
  detailsSubmitted: Boolean(account?.details_submitted),
  chargesEnabled: Boolean(account?.charges_enabled),
  payoutsEnabled: Boolean(account?.payouts_enabled),
  requirementsDue: account?.requirements?.currently_due || [],
  lastCheckedAt: new Date(),
});

export const createExpressAccountLink = async (req, res) => {
  try {
    const { user, errorResponse } = await ensureProfessionalUser(req, res);
    if (!user) return errorResponse;

    const { refreshUrl, returnUrl } = buildConnectUrls();

    let account;
    if (user.stripeAccountId) {
      try {
        account = await stripe.accounts.retrieve(user.stripeAccountId);
      } catch (retrieveError) {
        if (retrieveError?.statusCode !== 404) {
          throw retrieveError;
        }
      }
    }

    if (!account) {
      account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      user.stripeAccountId = account.id;
      user.stripeAccountCreatedAt = new Date();
    } else {
      account = await ensureAccountCapabilities(account.id);
    }

    user.stripeAccountUpdatedAt = new Date();
    user.stripeConnectStatus = mapAccountToStatus(account);
    await user.save();

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return res.json({
      url: accountLink.url,
      accountId: account.id,
    });
  } catch (err) {
    console.error("Failed to create Stripe Connect onboarding link", err);
    return res.status(500).json({ error: "Unable to create Stripe Connect link" });
  }
};

export const getStripeAccountStatus = async (req, res) => {
  try {
    const { user, errorResponse } = await ensureProfessionalUser(req, res);
    if (!user) return errorResponse;

    if (!user.stripeAccountId) {
      return res.status(404).json({ error: "Stripe account not linked" });
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    const status = mapAccountToStatus(account);

    user.stripeConnectStatus = status;
    user.stripeAccountUpdatedAt = new Date();
    await user.save();

    return res.json({
      accountId: account.id,
      status,
      capabilities: account.capabilities,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requirementsDue: account.requirements?.currently_due || [],
    });
  } catch (err) {
    console.error("Failed to retrieve Stripe account status", err);
    return res.status(500).json({ error: "Unable to retrieve Stripe account status" });
  }
};

export const createStripeLoginLink = async (req, res) => {
  try {
    const { user, errorResponse } = await ensureProfessionalUser(req, res);
    if (!user) return errorResponse;

    if (!user.stripeAccountId) {
      return res.status(404).json({ error: "Stripe account not linked" });
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    const loginLinkParams = {};
    if (process.env.STRIPE_CONNECT_RETURN_URL) {
      loginLinkParams.redirect_url = process.env.STRIPE_CONNECT_RETURN_URL;
    }

    const loginLink = await stripe.accounts.createLoginLink(
      account.id,
      loginLinkParams,
    );

    user.stripeAccountUpdatedAt = new Date();
    await user.save();

    return res.json({
      url: loginLink.url,
      expiresAt: loginLink.expires_at,
    });
  } catch (err) {
    console.error("Failed to create Stripe login link", err);
    return res.status(500).json({ error: "Unable to create Stripe login link" });
  }
};
