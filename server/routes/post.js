import express from "express";
const router = express.Router();

// controllers
import { addPost , getPosts } from "../controllers/post.js";


// Adding to DB: SECOND add a route here
router.post("/add-post", addPost); 
router.get("/get-posts", getPosts);


export default router;