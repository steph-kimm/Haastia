import Request from "../models/request.js";
import cloudinary from "cloudinary";
import { nanoid } from "nanoid";

export const addRequest = async (req, res) => {
    console.log('adding');
    try {
        const { client, recipient, post, selectedAddOns, requestType } = req.body;
        console.log(client, recipient, post, selectedAddOns, requestType);
        // Create a new message instance
        const request = await new Request({
            client,
            recipient,
            post,
            addOns:selectedAddOns,
            requestType
        }).save();

        res.status(201).json({ message: 'Request added successfully', data: request });
    } catch (error) {
        console.error('Error adding request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getRequestsByRecipientId = async (req, res) => {
    try {
        const recipientId = req.params.recipientId; // Get recipient ID from request parameters

        // Find requests where the recipient ID matches
        const requests = await Request.find({ recipient: recipientId }).populate('post');

        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const getRequestsByClientId = async (req, res) => {
    try {
        const clientId = req.params.clientId; // Get client ID from request parameters

        // Find requests where the client ID matches
        const requests = await Request.find({ client: clientId }).populate('post');

        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const updateRequestStatus = async (req, res) => {
    try {
        // Extract requestId and updated fields from request body
        const { requestId } = req.params;
        const { requestType } = req.body;

        // Find the request by its ID and update the requestType field
        const updatedRequest = await Request.findByIdAndUpdate(
            requestId,
            { requestType },
            { new: true } // Return the updated document
        );

        // Check if request was found and updated
        if (!updatedRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Send the updated request as the response
        res.status(200).json({ message: 'Request updated successfully', data: updatedRequest });
    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// module.exports = { addRequest };