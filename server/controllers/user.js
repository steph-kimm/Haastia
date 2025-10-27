import User from "../models/user.js";
import cloudinary from "cloudinary";

// sendgrid
// require("dotenv").config();
import { } from 'dotenv/config'
// import dotenv from "dotenv";

// const sgMail = require("@sendgrid/mail");
// TODO: sanitize and validate all data before sending it
// Adding to DB: FIRST add a controller here
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
})

export const updateSavedPosts = async (req, res) => {
    console.log('inside controller');
    try {
        const { posts } = req.body;
        console.log(req.body.user.user_id)
        // const hashedPassword = await hashPassword(password);
        const user = await User.findByIdAndUpdate(
            req.body.user._id,
            {
                saved_posts: posts,
            });
        user.password = undefined;
        user.secret = undefined;
        return res.json(user);
    } catch (err) {
        console.log(err);
    }
};

export const getUserProfile = async (req, res) => {
    console.log("fetching user")
    try {
        console.log('getting user')
        const user = await User.findById(req.params.userId);
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const uploadImage = async (req, res) => {
    try {
        const result = await cloudinary.uploader.upload(req.body.image, {
            public_id: nanoid(),
            resource_type: 'jpg',
        });// this takes the base64 image given and passes an id and safe url for the database
        console.log('result', result);
        console.log(req.body.user);
        const user = await User.findByIdAndUpdate(
            req.body.user._id,
            {
                image: {
                    public_id: result.public_id,
                    url: result.secure_url,
                },
            },
            { new: true }
        );
        console.log("user,", user);
        return res.json({
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
        });
    } catch (err) {
        console.log(err);
    }
};