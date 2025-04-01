import express from "express";
const router = express.Router();

// controllers
import {addBooking, getBookingsByRecipientId, updateBookingStatus, getBookingsByClientId, addReview, getUserReviews, getAvailableSlots} from "../controllers/booking.js";

// TODO: chane the "request" routes to be "booking" 
router.post("/add-request", addBooking); 
router.post("/add-review", addReview); 
router.get('/available-slots/:userId', getAvailableSlots);
router.get('/recipient-requests/:recipientId', getBookingsByRecipientId);
router.get('/client-requests/:clientId', getBookingsByClientId);
router.patch('/requests/:requestId', updateBookingStatus);
router.get("/get-reviews-by-user/:userId", getUserReviews);

export default router;