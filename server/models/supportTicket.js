import mongoose from "mongoose";
const { Schema } = mongoose;

const supportTicketSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    category: {
        type: String,
        enum: ['Payment', 'Service', 'Other'],
        required: true,
    },
    serviceNumber: {
        type: String, //TODO: this should be a reference to a service. 
        required: false,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: 'Pending',
    },
}, { timestamps: true });

export default mongoose.model("SupportTicket", supportTicketSchema);
