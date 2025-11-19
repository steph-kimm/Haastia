import express from "express";
import {
  createBooking,
  getBookingsForProfessional,
  getBookingsForCustomer,
  updateBookingStatus,
  cancelBooking,
  completeBooking,
  getAvailableSlotsForProfessional,
  getBookingByManageToken,
  cancelBookingByManageToken,
  rescheduleBookingByManageToken,
} from "../controllers/booking.js";

import { optionalAuth } from "../middlewares/optionalAuth.js";
import { requireSignin } from "../middlewares/auth.js";
import {
  manageBookingRateLimit,
  logManageBookingRequest,
} from "../middlewares/manageBookingGuard.js";

const router = express.Router();

// Create booking
router.post("/", optionalAuth, createBooking);

// Get bookings for a professional
router.get("/professional/:id", getBookingsForProfessional);

// Get available slots for a professional excluding accepted bookings
router.get("/professional/:id/available-slots", getAvailableSlotsForProfessional);

// Get bookings for a customer
router.get("/customer/:id", getBookingsForCustomer);

// Update booking status (accept/decline)
router.put("/:id/status", requireSignin, updateBookingStatus);

// Cancel (customer OR professional)
router.put("/:id/cancel", requireSignin, cancelBooking);

// Complete (professional)
router.put("/:id/complete", requireSignin, completeBooking);

// Customer self-serve endpoints (unauthenticated, rate-limited + logged)
router.get(
  "/manage/:token",
  manageBookingRateLimit,
  logManageBookingRequest,
  getBookingByManageToken,
);
router.put(
  "/manage/:token/cancel",
  manageBookingRateLimit,
  logManageBookingRequest,
  cancelBookingByManageToken,
);
router.put(
  "/manage/:token/reschedule",
  manageBookingRateLimit,
  logManageBookingRequest,
  rescheduleBookingByManageToken,
);

export default router;
