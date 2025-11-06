import User from "../models/user.js";
import jwt from "jsonwebtoken";
import { hashPassword, comparePassword } from "../helpers/auth.js";
import { nanoid } from "nanoid";
import cloudinary from "cloudinary";
import Availability from "../models/availability.js";
import { sendEmail } from "../utils/sendEmail.js";
import PendingSignup from "../models/pendingSignup.js";
import Stripe from "stripe";
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


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


export const signup = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    // Look up the pending signup linked to this Stripe session
    const pendingSignup = await PendingSignup.findOne({ sessionId });
    if (!pendingSignup) {
      return res.status(404).json({ error: "Pending signup not found" });
    }

    // Verify the Stripe session and ensure payment succeeded before creating the account
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (
      !session ||
      session.payment_status !== "paid" ||
      session.metadata?.pendingSignupId !== pendingSignup._id.toString()
    ) {
      return res
        .status(400)
        .json({ error: "Payment for this session has not been completed" });
    }

    const {
      name,
      email,
      hashedPassword,
      location,
      role,
      isProvider,
      availability,
    } = pendingSignup;

    // Guard against a user being created manually before payment finalization
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await PendingSignup.deleteOne({ _id: pendingSignup._id });
      return res.status(400).json({ error: "Email is already in use" });
    }

    // Create the user now that payment is confirmed
    const user = await new User({
      name,
      email,
      password: hashedPassword,
      location,
      role,
      isSubscribed: true,
    }).save();

    // If provider, create availability record(s) from pending signup payload
    if (isProvider && Array.isArray(availability) && availability.length > 0) {
      const availabilityDocs = availability.map((a) => ({
        professionalId: user._id,
        day: a.day,
        slots: a.slots,
      }));
      await Availability.insertMany(availabilityDocs);
    }

    // Remove the pending signup record once it has been fulfilled
    await PendingSignup.deleteOne({ _id: pendingSignup._id });

    // Create JWT token
    const token = jwt.sign(
      { _id: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✉️ Send welcome email (non-blocking)
    try {
      await sendEmail(
        email,
        "Welcome to Haastia!",
        `Hi ${name},\n\nThanks for joining Haastia! Your account has been successfully created.\n\nEnjoy booking and managing your appointments easily.\n\n— The Haastia Team`
      );
      console.log(`Welcome email sent to ${email}`);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Do not return error — user signup should still succeed
    }

    // Respond
    const { password: _, ...userWithoutPassword } = user._doc;
    return res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Signup failed. Please try again." });
  }
};


export const signin = async (req, res) => {
    console.log("signingn in ")
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




// Not used now has own file/schema
// export const updateAvailability = async (req, res) => {
//     try {
//       const { userId } = req.params;
//       const { availability } = req.body;
  
//       const updatedUser = await User.findByIdAndUpdate(
//         userId,
//         { availability },
//         { new: true }
//       );
  
//       res.json(updatedUser);
//     } catch (err) {
//       console.error('Failed to update availability:', err);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   };
  