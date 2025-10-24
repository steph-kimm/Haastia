import User from "../models/user.js";
import jwt from "jsonwebtoken";
import { hashPassword, comparePassword } from "../helpers/auth.js";
import { nanoid } from "nanoid";
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

import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_KEY);

// export const signup = async (req, res) => {
//     const { name, email, password, location, isProvider, availability } = req.body;
//     console.log(name, email, location, isProvider, availability );
//     try {
//         const user = new User({
//             name,
//             email,
//             password,
//             location,
//             role: isProvider ? 'Provider' : 'Customer',
//             availability: isProvider ? availability : []
//         });
//         await user.save();
//         res.status(201).json({ message: 'User signed up successfully', data: user });
//     } catch (error) {
//         console.error('Error signing up:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };

export const signup = async (req, res) => {
    try {
        const { name, email, password, location, isProvider, availability } = req.body;
        // validation TODO: move validation to front end?
        if (!name) {
            return res.json({
                error: "Name is required",
            });
        }
        if (!email) {
            return res.json({
                error: "Email is required",
            });
        }
        if (!password || password.length < 6) {
            return res.json({
                error: "Password is required and should be 6 characters long",
            });
        }
        const exist = await User.findOne({ email });
        if (exist) {
            return res.json({
                error: "Email is taken",
            });
        }
        // hash password
        const hashedPassword = await hashPassword(password);
        // IF you add the below back, amke sure you ONLY run it if someone put an image
        // upload image to cloudinary 
        // const result = await cloudinary.uploader.upload(image, {
        //     public_id: nanoid(),
        //     resource_type: 'jpg',
        // });// this takes the base64 image given and passes an id and safe url for the database
        
        try {
            const user = await new User({
                name,
                email,
                password:hashedPassword,
                location,
                role: isProvider ? 'Provider' : 'Customer',
                availability: isProvider ? availability : []
            }).save();

            // const user = await new User({
            //     name,
            //     email,
            //     password: hashedPassword,
            //     location, 
            //     role, 
            //     image: {
            //         public_id: result.public_id,
            //         url: result.secure_url,
            //     },
            // }).save();
            // create signed token
            // const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
            //     expiresIn: "7d",
            // });
            const token = jwt.sign({ _id: user._id, name: user.name, role: user.role }, process.env.JWT_SECRET, {
                expiresIn: "7d",
            });
            //   console.log(user);
            const { password, ...rest } = user._doc;
            return res.json({
                token,
                user: rest,
            });
        } catch (err) {
            console.log(err);
        }
    } catch (err) {
        console.log(err);
    }
};

export const signin = async (req, res) => {
    // console.log(req.body);
    try {
        const { email, password } = req.body;
        // check if our db has user with that email
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({
                error: "No user found",
            });
        }
        // check password
        const match = await comparePassword(password, user.password);
        if (!match) {
            return res.json({
                error: "Wrong password",
            });
        }
        // create signed token
        // const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        //     expiresIn: "7d",
        // });
        const token = jwt.sign({ _id: user._id, name: user.name, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });
        user.password = undefined;
        user.secret = undefined;
        res.json({
            token,
            user,
        });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    // find user by email
    const user = await User.findOne({ email });
    console.log("USER ===> ", user);
    if (!user) {
        return res.json({ error: "User not found" });
    }
    // generate code
    const resetCode = nanoid(5).toUpperCase();
    // save to db
    user.resetCode = resetCode;
    user.save();
    // prepare email
    const emailData = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Password reset code",
        html: "<h1>Your password  reset code is: {resetCode}</h1>"
    };
    // send email
    try {
        const data = await sgMail.send(emailData);
        console.log(data);
        res.json({ ok: true });
    } catch (err) {
        console.log(err);
        res.json({ ok: false });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, password, resetCode } = req.body;
        // find user based on email and resetCode
        const user = await User.findOne({ email, resetCode });
        // if user not found
        if (!user) {
            return res.json({ error: "Email or reset code is invalid" });
        }
        // if password is short
        if (!password || password.length < 6) {
            return res.json({
                error: "Password is required and should be 6 characters long",
            });
        }
        // hash password
        const hashedPassword = await hashPassword(password);
        user.password = hashedPassword;
        user.resetCode = "";
        user.save();
        return res.json({ ok: true });
    } catch (err) {
        console.log(err);
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

export const updatePassword = async (req, res) => {
    console.log('IN HERE', res)
    try {
        const { password } = req.body;
        console.log('IN HERE', res)
        console.log(req.body.user.user_id)
        const hashedPassword = await hashPassword(password);
        const user = await User.findByIdAndUpdate(
            req.body.user._id,
            {
                password: hashedPassword,
            });
        user.password = undefined;
        user.secret = undefined;
        return res.json(user);
    } catch (err) {
        console.log(err);
    }
};

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

export const updateAvailability = async (req, res) => {
    try {
      const { userId } = req.params;
      const { availability } = req.body;
  
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { availability },
        { new: true }
      );
  
      res.json(updatedUser);
    } catch (err) {
      console.error('Failed to update availability:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  