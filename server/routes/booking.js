import express from "express";
import {
  createBooking,
  getBookingsForProfessional,
  getBookingsForCustomer,
  updateBookingStatus,
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

export default router;
