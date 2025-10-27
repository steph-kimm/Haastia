import express from "express";
import {
  addService,
  getServices,
  getServiceById,
  getProfessionalServices,
} from "../controllers/service.js";

const router = express.Router();

router.post("/", addService); // Create new service
router.get("/", getServices); // Get all services
router.get("/:id", getServiceById); // Get one service
router.get("/by-user/:userId", getProfessionalServices); // Get services for one professional

export default router;
