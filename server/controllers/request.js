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

        // Save the message to the database
        // await newRequest.save();

        res.status(201).json({ message: 'Request added successfully', data: request });
    } catch (error) {
        console.error('Error adding request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// module.exports = { addRequest };