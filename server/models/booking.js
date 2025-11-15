import mongoose from "mongoose";
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
      enum: ["deposit", "full"],
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
    stripeChargeId: { type: String },
    stripeTransferId: { type: String },
    paidAt: { type: Date },

    // Lifecycle state
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled", "completed"],
      default: "pending",
    },

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

export default mongoose.model("Booking", bookingSchema);
