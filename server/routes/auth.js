import express from "express";
const router = express.Router();

// controllers
import { signup, signin, forgotPassword, resetPassword } from "../controllers/auth.js";
// uploadImage, updatePassword, updateSavedPosts, getUserProfile, getProfessionalProfile
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
// router.post("/upload-image", uploadImage);
// router.post("/upload-password", updatePassword);
// router.post("/update-saved-posts", updateSavedPosts);
// router.get("/get-user/:userId", getUserProfile);
//general user
// router.put('/update-availability/:userId', updateAvailability);
// router.get("/:id", getProfessionalProfile);
export default router;