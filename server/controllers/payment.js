// controllers/stripeController.js
import Stripe from "stripe";
import PendingSignup from "../models/pendingSignup.js";
import User from "../models/user.js";
import Service from "../models/service.js";
import Booking from "../models/booking.js";
import {
  findSlotConflicts,
  normalizeDateOnly,
  normalizeTimeSlot,
} from "../utils/scheduling.js";
import { hashPassword } from "../helpers/auth.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SUBSCRIPTION_PRICE_ID =
  process.env.STRIPE_SUBSCRIPTION_PRICE_ID || "price_1SQHPq2KTn444Cl1CHYtqYqf";
const DEFAULT_PAYMENT_CURRENCY =
  (process.env.STRIPE_DEFAULT_CURRENCY || "usd").toLowerCase();
const PLATFORM_FEE_PERCENT = Number(
  process.env.STRIPE_PLATFORM_FEE_PERCENT ??
    process.env.STRIPE_APPLICATION_FEE_PERCENT ??
    0,
);

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

const normalizeGuestInfo = (guestInfo = {}, fallback = {}) => {
  const normalized = {
    name: guestInfo.name ?? fallback.name ?? "",
    email: guestInfo.email ?? fallback.email ?? "",
    phone: guestInfo.phone ?? fallback.phone ?? "",
  };

  ["name", "email", "phone"].forEach((key) => {
    if (typeof normalized[key] === "string") {
      normalized[key] = normalized[key].trim();
    }
  });

  if (!normalized.name && !normalized.email && !normalized.phone) {
    return null;
  }

  return normalized;
};

const computeApplicationFeeAmount = (amountInCents) => {
  if (!Number.isFinite(PLATFORM_FEE_PERCENT) || PLATFORM_FEE_PERCENT <= 0) {
    return null;
  }
  const fee = Math.round((amountInCents * PLATFORM_FEE_PERCENT) / 100);
  return fee > 0 ? fee : null;
};

const parseCurrencyInput = (candidate) => {
  if (!candidate || typeof candidate !== "string") {
    return DEFAULT_PAYMENT_CURRENCY;
  }
  return candidate.trim().toLowerCase();
};

const findBookingForIntent = async (paymentIntent) => {
  if (!paymentIntent) return null;

  const bookingId = paymentIntent.metadata?.bookingId;
  if (bookingId) {
    const booking = await Booking.findById(bookingId);
    if (booking) return booking;
  }

  if (paymentIntent.id) {
    return Booking.findOne({ stripePaymentIntentId: paymentIntent.id });
  }

  return null;
};

const centsToCurrencyUnits = (amountInCents) => {
  if (typeof amountInCents !== "number") return 0;
  return Number((amountInCents / 100).toFixed(2));
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
      ui_mode: "embedded",
      line_items: [
        {
          price: SUBSCRIPTION_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        pendingSignupId: pendingSignup._id.toString(),
      },
      // success_url: appendSessionIdPlaceholder(successUrl),
      // cancel_url: appendSessionIdPlaceholder(cancelUrl),
      return_url: appendSessionIdPlaceholder(successUrl),
    });

    if (!session.client_secret) {
      console.error("Stripe session missing client secret for embedded checkout", session.id);
      return res
        .status(500)
        .json({ error: "Unable to initialize embedded checkout. Please try again." });
    }

    // Store the Stripe session ID on the pending signup for later verification
    pendingSignup.sessionId = session.id;
    await pendingSignup.save();

    return res.status(200).json({
      url: session.url,
      sessionId: session.id,
      pendingSignupId: pendingSignup._id.toString(),
      embeddedClientSecret: session.client_secret,
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

export const createServiceBookingIntent = async (req, res) => {
  try {
    const {
      serviceId,
      professionalId,
      bookingId,
      date,
      timeSlot,
      paymentOption = "deposit",
      guestInfo,
      contactName,
      contactEmail,
      contactPhone,
      currency,
      name,
      email,
      phone,
    } = req.body;

    if (!serviceId || !professionalId) {
      return res.status(400).json({ error: "serviceId and professionalId are required" });
    }

    if (!date) {
      return res.status(400).json({ error: "Booking date is required" });
    }

    if (!timeSlot?.start || !timeSlot?.end) {
      return res.status(400).json({ error: "A valid time slot is required" });
    }

    if (!["deposit", "full"].includes(paymentOption)) {
      return res.status(400).json({ error: "Invalid payment option" });
    }

    const service = await Service.findById(serviceId).select(
      "price deposit professional title",
    );
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    if (String(service.professional) !== String(professionalId)) {
      return res
        .status(400)
        .json({ error: "Service does not belong to the selected professional" });
    }

    const professional = await User.findById(professionalId).select(
      "stripeAccountId name",
    );
    if (!professional) {
      return res.status(404).json({ error: "Professional not found" });
    }

    if (!professional.stripeAccountId) {
      return res.status(400).json({
        error:
          "This professional hasn't finished setting up payments yet. Please try another provider or try again later.",
      });
    }

    let stripeAccount;
    try {
      stripeAccount = await stripe.accounts.retrieve(professional.stripeAccountId);
    } catch (err) {
      console.error("Unable to retrieve Stripe account", err);
      return res
        .status(502)
        .json({ error: "Unable to verify payout account. Please try again." });
    }

    if (!stripeAccount?.charges_enabled) {
      return res.status(400).json({
        error:
          "This professional can't accept payments yet. Please pick a different professional or try again later.",
      });
    }

    const normalizedPaymentOption = paymentOption === "full" ? "full" : "deposit";
    const servicePrice = Number(service.price);
    const depositAmount = Number(service.deposit ?? 0);

    if (normalizedPaymentOption === "deposit" && depositAmount <= 0) {
      return res.status(400).json({
        error: "Deposit payments are not available for this service.",
      });
    }

    const amount = normalizedPaymentOption === "full" ? servicePrice : depositAmount;
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Unable to determine a valid charge amount" });
    }

    const normalizedDate = normalizeDateOnly(date);
    if (!normalizedDate) {
      return res.status(400).json({ error: "Invalid booking date" });
    }

    const normalizedSlot = normalizeTimeSlot(timeSlot);
    if (!normalizedSlot) {
      return res.status(400).json({ error: "Invalid time slot" });
    }

    const conflict = await findSlotConflicts({
      professionalId,
      date: normalizedDate,
      timeSlot: normalizedSlot,
      excludeBookingId: bookingId,
    });

    if (conflict) {
      return res.status(409).json({
        error: "Selected time slot is no longer available. Please choose another time.",
      });
    }

    const derivedGuestInfo = normalizeGuestInfo(guestInfo, {
      name: contactName ?? name,
      email: contactEmail ?? email,
      phone: contactPhone ?? phone,
    });

    if (!req.user?._id) {
      if (!derivedGuestInfo?.name || !derivedGuestInfo?.email || !derivedGuestInfo?.phone) {
        return res.status(400).json({
          error: "Guest name, email, and phone are required for checkout",
        });
      }
    }

    let booking;
    if (bookingId) {
      booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      if (
        booking.professional &&
        String(booking.professional) !== String(professionalId)
      ) {
        return res.status(400).json({ error: "Booking belongs to a different professional" });
      }
      if (booking.service && String(booking.service) !== String(serviceId)) {
        return res.status(400).json({ error: "Booking is linked to a different service" });
      }
    } else {
      booking = new Booking();
    }

    booking.professional = professionalId;
    booking.service = serviceId;
    booking.date = normalizedDate;
    booking.timeSlot = normalizedSlot;
    booking.paymentOption = normalizedPaymentOption;
    booking.amountDue = amount;
    booking.amountPaid = 0;
    booking.paymentStatus = "requires_payment";
    booking.status = "pending";
    booking.acceptedAt = undefined;
    booking.paidAt = undefined;
    booking.stripePaymentIntentId = undefined;
    booking.stripePaymentIntentClientSecret = undefined;

    if (req.user?._id) {
      booking.customer = req.user._id;
      booking.guestInfo = undefined;
    } else if (derivedGuestInfo) {
      booking.customer = undefined;
      booking.guestInfo = derivedGuestInfo;
    }

    await booking.save();

    const amountInCents = Math.round(amount * 100);
    const selectedCurrency = parseCurrencyInput(currency);

    const paymentIntentParams = {
      amount: amountInCents,
      currency: selectedCurrency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingId: booking._id.toString(),
        serviceId: serviceId.toString(),
        professionalId: professionalId.toString(),
        paymentOption: normalizedPaymentOption,
      },
      transfer_data: {
        destination: professional.stripeAccountId,
      },
    };

    const applicationFeeAmount = computeApplicationFeeAmount(amountInCents);
    if (applicationFeeAmount) {
      paymentIntentParams.application_fee_amount = applicationFeeAmount;
    }

    const receiptEmail = req.user?.email || derivedGuestInfo?.email;
    if (receiptEmail) {
      paymentIntentParams.receipt_email = receiptEmail;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
    if (!paymentIntent?.client_secret) {
      return res
        .status(500)
        .json({ error: "Stripe failed to return a client secret for this booking" });
    }

    booking.stripePaymentIntentId = paymentIntent.id;
    booking.stripePaymentIntentClientSecret = paymentIntent.client_secret;
    await booking.save();

    return res.status(200).json({
      bookingId: booking._id,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency: selectedCurrency,
      paymentOption: normalizedPaymentOption,
    });
  } catch (err) {
    console.error("Failed to initialize service booking intent", err);
    return res
      .status(500)
      .json({ error: "Unable to initialize payment for this booking" });
  }
};

const handlePaymentIntentSucceeded = async (paymentIntent) => {
  const booking = await findBookingForIntent(paymentIntent);
  if (!booking) {
    console.warn(
      "Received payment_intent.succeeded for unknown booking",
      paymentIntent?.id,
    );
    return;
  }

  booking.paymentStatus = "paid";
  booking.amountPaid = centsToCurrencyUnits(
    paymentIntent.amount_received ?? paymentIntent.amount,
  );
  booking.status = "accepted";
  booking.acceptedAt = booking.acceptedAt ?? new Date();
  booking.paidAt = new Date();
  booking.stripePaymentIntentId = paymentIntent.id;
  await booking.save();
};

const handlePaymentIntentFailed = async (paymentIntent) => {
  const booking = await findBookingForIntent(paymentIntent);
  if (!booking) {
    console.warn(
      "Received payment_intent.payment_failed for unknown booking",
      paymentIntent?.id,
    );
    return;
  }

  booking.paymentStatus = "failed";
  booking.amountPaid = 0;
  booking.paidAt = undefined;
  booking.status = "pending";
  booking.acceptedAt = undefined;
  booking.stripePaymentIntentId = paymentIntent.id;
  await booking.save();
};

export const handleStripeWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event = req.body;
  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } else if (req.body instanceof Buffer) {
      event = JSON.parse(req.body.toString("utf8"));
    }
  } catch (err) {
    console.error("Stripe webhook verification failed", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;
      default:
        break;
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("Error while handling Stripe webhook", err);
    return res.status(500).send("Webhook handler error");
  }
};
