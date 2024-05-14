import mongoose from "mongoose";
const { Schema } = mongoose;

const requestedAddons = new mongoose.Schema({
    // 
})

const requestSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    addOns: [{ type: String }],
    requestType: { type: String, enum: ['approval', 'denial' , 'pending'], default: 'pending' },
    // dateTime: { type: Date, default: Date.now },
});


export default mongoose.model("Request", requestSchema); 