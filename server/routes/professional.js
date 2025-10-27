import express from "express";
const router = express.Router();

// controllers
import { getProfessionalProfile } from "../controllers/professional.js";

router.get("/:id", getProfessionalProfile);

export default router;