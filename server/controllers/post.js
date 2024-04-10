import Post from "../models/Post.js";
import cloudinary from "cloudinary";
import { nanoid } from "nanoid";

export const addPost = async (req, res) => {
    console.log(req.body);
    try {
        let imageArray = [];
        for (let i = 0; i < req.body.images.length; i++) {
            const result = await cloudinary.uploader.upload(req.body.images[i], {
                public_id: nanoid(),
                resource_type: 'jpg',
            });// this takes the base64 image given and passes an id and safe url for the database
            let image = {public_id: result.public_id, url: result.secure_url,}
            imageArray.push(image);
        }
        console.log('imageArray', imageArray);
        // console.log('result', result);

        // title, description, price, category, images

        req.body.images = imageArray;
        // const post = await new Post({
        //     title: req.body.title,
        //     description: req.body.description,
        //     price: req.body.price,
        //     category: req.body.category,
        //     images: imageArray,

        // }).save();


        const post = await new Post({ ...req.body }).save();
        res.json(post);

    } catch (err) {
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
    } catch (err) {
        console.log('error:', error);
    }
}