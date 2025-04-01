import Booking from "../models/booking.js";
import User from "../models/user.js";
import cloudinary from "cloudinary";
import { nanoid } from "nanoid";
import Review from "../models/review.js";

export const addBooking = async (req, res) => {
    console.log('Adding booking');
    try {
        const { client, recipient, post, selectedAddOns, requestType, dateTime, duration } = req.body;
        console.log(client, recipient, post, selectedAddOns, requestType, dateTime, duration);

        // Convert dateTime to a Date object if it's not already one
        const startDateTime = new Date(dateTime);
        const endDateTime = new Date(startDateTime.getTime() + duration * 6000); // duration in milliseconds

        // Check for overlapping bookings
        const overlappingBooking = await Booking.findOne({
            recipient,
            post,
            dateTime: {
                $lt: endDateTime,
            },
            $where: `this.dateTime.getTime() + this.duration * 60000 > ${startDateTime.getTime()}`,
        });

        if (overlappingBooking) {
            return res.status(400).json({ message: 'This time slot is already booked.' });
        }

        const booking = await new Booking({
            client,
            recipient,
            post,
            addOns: selectedAddOns,
            requestType,
            dateTime: startDateTime,
            duration,
        }).save();

        res.status(201).json({ message: 'Booking added successfully', data: booking });
    } catch (error) {
        console.error('Error adding booking:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// export const addBooking = async (req, res) => {
//     console.log('adding');
//     try {
//         const { client, recipient, post, selectedAddOns, requestType, dateTime } = req.body;
//         console.log(client, recipient, post, selectedAddOns, requestType, dateTime);

//         const booking = await new Booking({
//             client,
//             recipient,
//             post,
//             addOns: selectedAddOns,
//             requestType,
//             dateTime,
//         }).save();

//         res.status(201).json({ message: 'Booking added successfully', data: booking });
//     } catch (error) {
//         console.error('Error adding booking:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };


export const getBookingsByRecipientId = async (req, res) => {
    try {
        const recipientId = req.params.recipientId; // Get recipient ID from request parameters

        // Find bookings where the recipient ID matches
        const bookings = await Booking.find({ recipient: recipientId }).populate('post');

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const getBookingsByClientId = async (req, res) => {
    try {
        const clientId = req.params.clientId; // Get client ID from request parameters

        // Find bookings where the client ID matches
        const bookings = await Booking.find({ client: clientId }).populate('post');

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// This controller is to get the user availibilty minus the appts already made. 
export const getAvailableSlots = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const bookings = await Booking.find({ provider: userId });
        const unavailableSlots = bookings.map(booking => ({
            day: booking.day,
            start: booking.dateTime,
            end: new Date(new Date(booking.dateTime).getTime() + booking.duration * 60000).toISOString(),
        }));

        const availableSlots = user.availability.map(avail => {
            const slots = avail.slots.filter(slot => {
                const start = new Date(`${avail.day}T${slot.split('-')[0]}:00`).toISOString();
                const end = new Date(`${avail.day}T${slot.split('-')[1]}:00`).toISOString();

                return !unavailableSlots.some(unavail => 
                    unavail.day === avail.day && 
                    ((start >= unavail.start && start < unavail.end) || 
                    (end > unavail.start && end <= unavail.end))
                );
            });

            return { day: avail.day, slots };
        });

        res.json(availableSlots);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateBookingStatus = async (req, res) => {
    try {
        // Extract requestId and updated fields from request body
        const { requestId } = req.params;
        const { requestType } = req.body;

        // Find the request by its ID and update the requestType field
        const updatedBooking = await Booking.findByIdAndUpdate(
            requestId,
            { requestType },
            { new: true } // Return the updated document
        );

        // Check if request was found and updated
        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Send the updated request as the response
        res.status(200).json({ message: 'Booking updated successfully', data: updatedBooking });
    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const addReview = async (req, res) => {
    console.log('adding review');
    try {
        const { client, recipient, post, text, rating, requestId } = req.body;
        console.log(client, recipient, post, text, rating);
        // Create a new message instance
        const request = await new Review({
            client,
            recipient,
            post,
            text,
            rating
        }).save();

        // Update the user's stats (jobs done and rating average)
        await updateUserStats(recipientId);
        // Update the request status to "reviewed"
        // await updateBookingStatus({ params: { requestId }, body: { requestType: 'reviewed' } }, res);

        res.status(201).json({ message: 'Review added successfully', data: request });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//NOTE: below isn't used anywhere and no route is set
export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const deletedReview = await Review.findByIdAndDelete(reviewId);

        if (!deletedReview) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Update the user's stats
        await updateUserStats(deletedReview.recipient);

        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
// TODO: add everything with Reviews in this file into their own file
const updateUserStats = async (userId) => {
    // This updates their amount of jobs done and reviews done
    try {
        const reviews = await Review.find({ recipient: userId });

        const jobsDone = reviews.length;
        const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
        const rating = jobsDone > 0 ? totalRating / jobsDone : 0;

        await User.findByIdAndUpdate(userId, { jobsDone, rating }, { new: true });
    } catch (error) {
        console.error('Error updating user stats:', error);
    }
};

export const getUserReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ recipient: req.params.userId });
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching user reviews:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
// module.exports = { addBooking };