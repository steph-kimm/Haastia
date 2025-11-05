import express from "express";
import {
  createBooking,
  getBookingsForProfessional,
  getBookingsForCustomer,
  updateBookingStatus,
    cancelBooking,
  completeBooking,
} from "../controllers/booking.js";

import { optionalAuth } from "../middlewares/optionalAuth.js";
import { requireSignin } from "../middlewares/auth.js";

const router = express.Router();

// Create booking
router.post("/", optionalAuth,  createBooking);

// Get bookings for a professional
router.get("/professional/:id", getBookingsForProfessional);

// Get bookings for a customer
router.get("/customer/:id", getBookingsForCustomer);

// Update booking status (accept/decline)
router.put("/:id/status", requireSignin, updateBookingStatus);

// Cancel (customer OR professional)
router.put("/:id/cancel", requireSignin, cancelBooking);

// Complete (professional)
router.put("/:id/complete", requireSignin, completeBooking);

export default router;
