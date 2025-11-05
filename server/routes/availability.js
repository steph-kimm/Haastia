import express from "express";
import { setAvailability, getAvailability } from "../controllers/availability.js";

const router = express.Router();

// POST /api/availability - create or update availability
router.post("/:professionalId", setAvailability);

// GET /api/availability/:professionalId - get all availability
router.get("/:professionalId", getAvailability);

export default router;
