import mongoose from "mongoose";
const { Schema } = mongoose;

export const DEFAULT_SCHEDULING_LIMITS = {
    minBookingLeadTimeMinutes: 0,
    maxBookingDaysInAdvance: null,
    rescheduleCutoffMinutes: null,
    cancelCutoffMinutes: null,
    maxBookingsPerSlot: null,
    maxBookingsPerDay: null,
    maxBookingsPerWeek: null,
};

const schedulingLimitsSchema = new Schema(
    {
        minBookingLeadTimeMinutes: { type: Number, min: 0, default: DEFAULT_SCHEDULING_LIMITS.minBookingLeadTimeMinutes },
        maxBookingDaysInAdvance: { type: Number, min: 0, default: DEFAULT_SCHEDULING_LIMITS.maxBookingDaysInAdvance },
        rescheduleCutoffMinutes: { type: Number, min: 0, default: DEFAULT_SCHEDULING_LIMITS.rescheduleCutoffMinutes },
        cancelCutoffMinutes: { type: Number, min: 0, default: DEFAULT_SCHEDULING_LIMITS.cancelCutoffMinutes },
        maxBookingsPerSlot: { type: Number, min: 0, default: DEFAULT_SCHEDULING_LIMITS.maxBookingsPerSlot },
        maxBookingsPerDay: { type: Number, min: 0, default: DEFAULT_SCHEDULING_LIMITS.maxBookingsPerDay },
        maxBookingsPerWeek: { type: Number, min: 0, default: DEFAULT_SCHEDULING_LIMITS.maxBookingsPerWeek },
    },
    { _id: false }
);

// const availabilitySchema = new Schema({
//     day: {
//         type: String,
//         required: true,
//     },
//     slots: {
//         type: [String], // Array of time slots (e.g., "09:00-11:00", "14:00-17:00")
//         required: true,
//     },
// });

const userSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true,
        },
        email: {
            type: String,
            trim: true,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            min: 6,
            max: 64,
        },
        role: { type: String, enum: ['customer', 'professional'], default: 'customer' },
        location: {
            type: String,
        },
        tagline: {
            type: String,
            trim: true,
            default: "",
        },
        bio: {
            type: String,
            trim: true,
            default: "",
        },
        businessAddress: {
            type: String,
            trim: true,
            default: "",
        },
        contactPhone: {
            type: String,
            trim: true,
            default: "",
        },
        website: {
            type: String,
            trim: true,
            default: "",
        },
        schedulingLimits: {
            type: schedulingLimitsSchema,
            default: () => ({ ...DEFAULT_SCHEDULING_LIMITS }),
        },
        image: {
            public_id: {
                type: String,
            },
            url: {
                type: String,
            },
        },
        saved_posts: {
            type: [String],
        },
        rating: {
            type: mongoose.Decimal128,
            default: 0,
        },
        profileGuidelines: {
            // Professional "before you book" guidelines surfaced on public profiles (trimmed, <= 2000 chars)
            type: String,
            trim: true,
            default: "",
        },
        jobs_done: {
            type: Number,
            default: 0,
        },
        stripeAccountId: {
            type: String,
            index: true,
        },
        stripeAccountCreatedAt: {
            type: Date,
        },
        stripeAccountUpdatedAt: {
            type: Date,
        },
        stripeConnectStatus: {
            detailsSubmitted: {
                type: Boolean,
                default: false,
            },
            chargesEnabled: {
                type: Boolean,
                default: false,
            },
            payoutsEnabled: {
                type: Boolean,
                default: false,
            },
            requirementsDue: {
                type: [String],
                default: [],
            },
            lastCheckedAt: {
                type: Date,
            },
        },
        isSubscribed: {
            type: Boolean,
            default: false, // Flipped to true once Stripe confirms payment completion
        },
        isActive: {
            type: Boolean,
            default: false, // Set to true after payment clears or immediately for direct signups
        },
        // availability: [availabilitySchema],
        // resetCode: "",
    },

    { timestamps: true }
);
export default mongoose.model("User", userSchema);
