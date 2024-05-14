import express from "express";
const router = express.Router();

// controllers
import { addRequest } from "../controllers/request.js";


// Adding to DB: SECOND add a route here
router.post("/add-request", addRequest); 

export default router;