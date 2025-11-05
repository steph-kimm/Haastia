import express from "express";
const router = express.Router();

import { uploadImage, updateSavedPosts, getUserProfile } from "../controllers/user.js";

router.post("/upload-image", uploadImage);
router.post("/update-saved-posts", updateSavedPosts);
router.get("/get-user/:userId", getUserProfile);

export default router;