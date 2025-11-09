import express from "express";
import { createCheckoutSession } from "../controllers/payment.js";

const router = express.Router();

// POST /api/stripe/create-checkout-session
router.post("/create-checkout-session", createCheckoutSession);

export default router;
