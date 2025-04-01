import SupportTicket from "../models/supportTicket.js";

export const submitSupportTicket = async (req, res) => {
    console.log('sibmiting ticket')
    try {
        const { category, serviceNumber, description } = req.body;

        if (!req.user) {
            return res.status(401).json({ message: "Please log in to submit a support ticket." });
        }

        const newTicket = new SupportTicket({
            category,
            serviceNumber,
            description,
            user: req.user._id,
        });

        await newTicket.save();

        res.status(201).json({ message: 'Thank you, we will get back to you within 72 hours.' });
    } catch (error) {
        console.error('Error submitting ticket:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};