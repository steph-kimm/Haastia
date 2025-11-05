import mongoose from "mongoose";
const { Schema } = mongoose;

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
        jobs_done: {
            type: Number,
            default: 0,
        },
        // availability: [availabilitySchema],
        // resetCode: "",
    },

    { timestamps: true }
);
export default mongoose.model("User", userSchema);