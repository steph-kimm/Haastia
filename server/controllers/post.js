import Post from "../models/Post.js";
import cloudinary from "cloudinary";
import { nanoid } from "nanoid";

export const addPost = async (req, res) => {
  try {
    let imageArray = [];
    if (req.body.images?.length > 0) {
      for (const img of req.body.images) {
        const result = await cloudinary.uploader.upload(img, {
          public_id: nanoid(),
          resource_type: 'jpg',
        });
        imageArray.push({
          public_id: result.public_id,
          url: result.secure_url
        });
      }
    }

    const post = await new Post({
      ...req.body,
      images: imageArray,
      owner: req.user._id // ✅ get owner from token
    }).save();

    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error adding service' });
  }
};


// export const addPost = async (req, res) => {

//     // console.log(req.body);
//     console.log("adding service")
//     try {
//         let imageArray = [];
//         if (req.body.images && req.body.images.length > 0) {
//             for (let i = 0; i < req.body.images.length; i++) {
//                 const result = await cloudinary.uploader.upload(req.body.images[i], {
//                     public_id: nanoid(),
//                     resource_type: 'jpg',
//                 });// this takes the base64 image given and passes an id and safe url for the database
//                 let image = { public_id: result.public_id, url: result.secure_url, }
//                 imageArray.push(image);
//             }
//         }
//         req.body.images = imageArray;
//         req.body.images = imageArray.length > 0 ? imageArray : [];
//         const owner = { id: req.body.owner._id, name: req.body.owner.name } // TODO: Pass in 2
//         req.body.owner = owner;

//         // req.body.owner = req.body.owner._id; //just ID
//         console.log(req.body)
//         const post = await new Post({ ...req.body }).save();
//         res.json(post);

//     } catch (err) {
//         console.log(err);
//     }

// }
// Currently this gets all the information in posts. This will make it too slow in the longrun so edit to only get whats needed. 

export const getPosts = async (req, res) => {
    console.log(req.body);
    try {
        const all = await Post.find().sort({ createdAt: -1 }).limit(500);
        console.log("fetched posts in server", all)
        res.json(all);
    } catch (err) {
        console.log('error:', err);
    }
}

export const getPostById = async (req, res) => {
    const { id } = req.params;
    try {
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(post);
    } catch (err) {
        console.log('error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
// Post is service
export const getUserPosts = async (req, res) => {
    try {
        const posts = await Post.find({ 'owner.id': req.params.userId });
        if (!posts) {
            return res.status(404).json({ message: 'No posts found for this user' });
        }
        res.json(posts);
    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};