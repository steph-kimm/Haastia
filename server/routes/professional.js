import express from "express";
import { requireSignin } from "../middlewares/auth.js";
import {
  createCustomerNote,
  getCustomerSummary,
  getProfessionalProfile,
  listMyCustomers,
  updateCustomerNote,
} from "../controllers/professional.js";

const router = express.Router();

router.get("/me/customers", requireSignin, listMyCustomers);
router.get("/me/customers/:customerId", requireSignin, getCustomerSummary);
router.post("/me/customers/:customerId/notes", requireSignin, createCustomerNote);
router.put(
  "/me/customers/:customerId/notes/:noteId",
  requireSignin,
  updateCustomerNote
);

router.get("/:id", getProfessionalProfile);

export default router;
