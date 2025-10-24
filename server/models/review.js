import mongoose from "mongoose";
const { Schema } = mongoose;


const reviewSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    text: { type: String, default: '' },  // Added field for text review
    rating: { type: Number, min: 1, max: 5, default: 5 }  // Added field for rating out of 5
    // dateTime: { type: Date, default: Date.now },
});

export default mongoose.model("Review", reviewSchema); 