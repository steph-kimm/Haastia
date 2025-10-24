import express from "express";
const router = express.Router();

// controllers
import { addPost , getPosts, getPostById, getUserPosts } from "../controllers/post.js";
import { requireSignin } from '../middlewares/auth.js';

// Adding to DB: SECOND add a route here
router.post("/add-post", requireSignin, addPost); 
router.get("/get-posts", getPosts);
router.get('/get-post/:id', getPostById);
router.get("/get-posts-by-user/:userId", getUserPosts);

export default router;