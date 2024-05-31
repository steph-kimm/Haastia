import express from "express";
const router = express.Router();

// controllers
import { addRequest } from "../controllers/request.js";
import { getRequestsByRecipientId } from "../controllers/request.js";
import { updateRequestStatus } from "../controllers/request.js";
import { getRequestsByClientId } from "../controllers/request.js";

// Adding to DB: SECOND add a route here
router.post("/add-request", addRequest); 
router.get('/recipient-requests/:recipientId', getRequestsByRecipientId);
router.get('/client-requests/:clientId', getRequestsByClientId);
router.patch('/requests/:requestId', updateRequestStatus);

export default router;