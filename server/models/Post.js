import mongoose from "mongoose";
const { Schema } = mongoose;

const imageSchema = new Schema({
    public_id: {
        type: String,
    },
    url: {
        type: String,
    },
})

const postSchema = new Schema(
    {
        title: {
            type: String,
            trim: true,
            required: true,
        },
        description: {
            type: String,
            trim: true,
            required: true,
            unique: true,
        },
        price: {
            type: Number,
            required: true,
            min: 20,
            max: 1000,
        },
        category: {
            type: String,
            default: "Other",
        },
        image: [imageSchema],
        // resetCode: "",
    },
    { timestamps: true }
);




export default mongoose.model("Post", postSchema); // instead of link