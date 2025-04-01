import mongoose from "mongoose";
const { Schema } = mongoose;

const requestedAddons = new mongoose.Schema({
    // 
})
const bookingSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    addOns: [{ type: String }],
    requestType: { type: String, enum: ['accepted', 'rejected', 'pending', 'completed', 'reviewed'], default: 'pending' },
    dateTime: { type: Date, required: true},
    duration: { type: Number, required: true }, // Duration in minutes
});


export default mongoose.model("Booking", bookingSchema); 