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
        // owner: {
        //     type: User,
        //     required: false // TODO URGENT: Chaneg this to true
        // },
        owner: {
            type: ownerSchema,
            required: false // TODO URGENT: Chaneg this to true
        },
        // owner: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: 'User',
        //     required: false // TODO URGENT: Chaneg this to true
        // },
    },
    { timestamps: true }
);




export default mongoose.model("Post", postSchema); // instead of link