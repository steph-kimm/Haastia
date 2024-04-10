import Post from "../models/Post.js";

export const addPost = async (req, res) => {
    console.log(req.body);
    try {
        const post = await new Post({ ...req.body }).save();
        res.json(post);
    }catch (err){
        console.log(err);
    }

}

export const getPosts = async (req, res) => {
    console.log(req.body);
    console.log('in colorollers');
    try {
        const all = await Post.find().sort({ createdAt: -1 }).limit(500);
        console.log("fetched posts in server", all)
        res.json(all);
    }catch (err){
        console.log('error:', error);
    }
}