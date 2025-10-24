import express from "express";
const router = express.Router();

// controllers
import { submitSupportTicket } from "../controllers/support.js";

router.post("/submit-ticket", submitSupportTicket); //TODO: can add middleware here to make sure user is logged in. 


export default router;