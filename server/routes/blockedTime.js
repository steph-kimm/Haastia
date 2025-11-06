import express from "express";
import {
  listBlockedTimes,
  createBlockedTime,
  deleteBlockedTime,
} from "../controllers/blockedTime.js";
import { requireSignin } from "../middlewares/auth.js";

const router = express.Router();

router.get("/:professionalId", listBlockedTimes);
router.post("/:professionalId", requireSignin, createBlockedTime);
router.delete("/:id", requireSignin, deleteBlockedTime);

export default router;
