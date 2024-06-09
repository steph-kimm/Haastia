import express from "express";
const router = express.Router();

// controllers
import { signup, signin, forgotPassword, resetPassword, uploadImage, updatePassword, updateSavedPosts } from "../controllers/auth.js";

router.get("/", (req, res) => {
    return res.json({
        data
        // data: "hello world from the API"
    });
});
// Adding to DB: SECOND add a route here
router.post("/signup", signup); 
router.post("/signin", signin);
router.post("/forgot-password", forgotPassword); 
router.post("/update-password", resetPassword);
router.post("/upload-image", uploadImage);
router.post("/upload-password", updatePassword);
router.post("/update-saved-posts", updateSavedPosts);

export default router;