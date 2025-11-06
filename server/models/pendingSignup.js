import mongoose from "mongoose";

const { Schema } = mongoose;

const pendingSignupSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        hashedPassword: {
            type: String,
            required: true,
        },
        location: {
            type: String,
        },
        role: {
            type: String,
            enum: ["customer", "professional"],
            required: true,
        },
        isProvider: {
            type: Boolean,
            default: false,
        },
        availability: {
            type: Array,
            default: [],
        },
        sessionId: {
            type: String,
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
    },
    { timestamps: true }
);

// TTL index so pending signups clean themselves up automatically after expiry
pendingSignupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PendingSignup", pendingSignupSchema);
