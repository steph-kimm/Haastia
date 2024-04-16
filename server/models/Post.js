import mongoose from "mongoose";
const { Schema } = mongoose;
import User from './user.js'

const imageSchema = new Schema({
    public_id: {
        type: String,
    },
    url: {
        type: String,
    },
})

const ownerSchema = new Schema({
    id: {
        type: String,
    },
    name: {
        type: String,
    },
})

const addOnSchema = new Schema({
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
    max: {
        type: Number,
        required: true,
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
        images: {
            type: [imageSchema],
            required: false
        },
        addOn: {
            type: [addOnSchema],
            required: false
        },
        owner: {
            type: ownerSchema,
            required: false // TODO URGENT: Chaneg this to true
        },
    },
    { timestamps: true }
);




export default mongoose.model("Post", postSchema); // instead of link