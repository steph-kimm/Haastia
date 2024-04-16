import mongoose from "mongoose";
const { Schema } = mongoose;
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
        role: {
            type: String,
            default: "Customer",
        },
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
        // resetCode: "",
    },
    
    { timestamps: true }
);
export default mongoose.model("User", userSchema);