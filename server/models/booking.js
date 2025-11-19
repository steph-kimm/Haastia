import mongoose from "mongoose";
import { generateManageTokenBundle } from "../utils/manageTokens.js";
const { Schema } = mongoose;

const cancellationSchema = new Schema(
  {
    by: { type: String, enum: ["customer", "professional"], required: true },
    at: { type: Date, default: Date.now },
    reason: { type: String },
  },
  { _id: false }
);

const bookingSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: "User", required: false }, // allow guests
    guestInfo: { name: String, email: String, phone: String },

    professional: { type: Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: Schema.Types.ObjectId, ref: "Service", required: true },

    date: { type: Date, required: true },
    timeSlot: {
      start: { type: String, required: true },
      end:   { type: String, required: true },
    },

    paymentOption: {
      type: String,
      enum: ["deposit", "full", "free"],
      default: "deposit",
    },
    amountDue: { type: Number, min: 0, default: 0 },
    amountPaid: { type: Number, min: 0, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["requires_payment", "processing", "paid", "failed", "refunded"],
      default: "requires_payment",
    },
    stripePaymentIntentId: { type: String },
    stripePaymentIntentClientSecret: { type: String },
    stripeChargeId: { type: String },
    stripeTransferId: { type: String },
    paidAt: { type: Date },
    reminderEmailSentAt: { type: Date, default: null },

    // Customer self-serve management
    manageToken: { type: String, required: true, index: true },
    manageTokenCreatedAt: { type: Date, default: Date.now },
    manageTokenExpiresAt: { type: Date },

    // Lifecycle state
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled", "completed"],
      default: "pending",
    },
    acceptedAt: { type: Date },

    // Cancellation details (optional)
    cancellation: { type: cancellationSchema, default: null },

    // Completion timestamp (optional)
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// helpful indexes
bookingSchema.index({ professional: 1, status: 1, date: 1 });
bookingSchema.index({ customer: 1, status: 1, date: 1 });

bookingSchema.pre("validate", function ensureManageToken(next) {
  if (!this.manageToken) {
    const bundle = generateManageTokenBundle();
    this.manageToken = bundle.hashed;
    this.manageTokenCreatedAt = bundle.createdAt;
    this.manageTokenExpiresAt = bundle.expiresAt;
  }
  next();
});

export default mongoose.model("Booking", bookingSchema);
