import express from "express";
const router = express.Router();

// controllers
import { addPost , getPosts, getPostById, getUserPosts } from "../controllers/post.js";


// Adding to DB: SECOND add a route here
router.post("/add-post", addPost); 
router.get("/get-posts", getPosts);
router.get('/get-post/:id', getPostById);
router.get("/get-posts-by-user/:userId", getUserPosts);

export default router;