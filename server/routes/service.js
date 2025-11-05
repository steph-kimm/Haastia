import express from "express";
import {
  addService,
  getMyServices,
  getProfessionalServices,
  deleteService,
  updateService,
} from "../controllers/service.js";
import { requireSignin } from "../middlewares/auth.js";

const router = express.Router();

// Create new service (professional only)
router.post("/", requireSignin, addService);

// Get services created by the logged-in professional
router.get("/my-services", requireSignin, getMyServices);

// Get services for a specific professional (public — for customer view)
router.get("/by-user/:userId", getProfessionalServices);

// Update one of the professional’s services
router.put("/:id", requireSignin, updateService);

// Delete a professional’s service
router.delete("/:id", requireSignin, deleteService);

export default router;
