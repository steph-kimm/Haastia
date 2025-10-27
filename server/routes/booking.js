import express from "express";
import {
  createBooking,
  getBookingsForProfessional,
  getBookingsForCustomer,
  updateBookingStatus,
} from "../controllers/booking.js";

const router = express.Router();

// Create booking
router.post("/", createBooking);

// Get bookings for a professional
router.get("/professional/:id", getBookingsForProfessional);

// Get bookings for a customer
router.get("/customer/:id", getBookingsForCustomer);

// Update booking status (accept/decline)
router.put("/:id/status", updateBookingStatus);

export default router;
