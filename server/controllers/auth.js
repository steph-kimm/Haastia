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
    const {
      sessionId,
      pendingSignupId,
      name,
      email,
      password,
      location,
      isProvider,
      availability,
    } = req.body;

    const sendWelcomeEmail = async (targetEmail, targetName) => {
      try {
        await sendEmail(
          targetEmail,
          "Welcome to Haastia!",
          `Hi ${targetName},\n\nThanks for joining Haastia! Your account has been successfully created.\n\nEnjoy booking and managing your appointments easily.\n\n— The Haastia Team`
        );
        console.log(`Welcome email sent to ${targetEmail}`);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Best-effort only — the signup should still succeed even if email fails.
      }
    };

    if (!sessionId) {
      if (!name) return res.status(400).json({ error: "Name is required" });
      if (!email) return res.status(400).json({ error: "Email is required" });
      if (!password || password.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters long" });
      }

      const normalizedEmail = email.toLowerCase();

      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ error: "Email is already in use" });
      }

      if (isProvider) {
        // Professional signup initiation: store pending record until payment completes.
        const existingPending = await PendingSignup.findOne({ email: normalizedEmail });
        if (existingPending) {
          return res
            .status(400)
            .json({ error: "A pending signup already exists for this email" });
        }

        const hashedPassword = await hashPassword(password);

        const pendingSignup = await PendingSignup.create({
          name,
          email: normalizedEmail,
          hashedPassword,
          location,
          role: "professional",
          isProvider: true,
          availability: Array.isArray(availability) ? availability : [],
        });

        return res.status(202).json({
          message:
            "Your professional account is pending activation. Complete checkout to go live.",
          pendingSignupId: pendingSignup._id.toString(),
        });
      }

      // Direct customer signup: activate account immediately.
      const hashedPassword = await hashPassword(password);
      const user = await new User({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        location,
        role: "customer",
        isSubscribed: false,
        isActive: true,
      }).save();

      await sendWelcomeEmail(normalizedEmail, name);

      const token = jwt.sign(
        { _id: user._id, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      const { password: _, ...userWithoutPassword } = user._doc;
      return res.json({
        token,
        user: userWithoutPassword,
      });
    }

    // Professional completion branch: verify Stripe checkout and finalize account.
    const pendingLookupQuery = pendingSignupId
      ? { _id: pendingSignupId, sessionId }
      : { sessionId };

    const pendingSignup = await PendingSignup.findOne(pendingLookupQuery);
    if (!pendingSignup) {
      return res.status(404).json({ error: "Pending signup not found" });
    }

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
      name: pendingName,
      email: pendingEmail,
      hashedPassword,
      location: pendingLocation,
      role,
      isProvider: pendingIsProvider,
      availability: pendingAvailability,
    } = pendingSignup;

    const existingUser = await User.findOne({ email: pendingEmail });
    if (existingUser) {
      await PendingSignup.deleteOne({ _id: pendingSignup._id });
      return res.status(400).json({ error: "Email is already in use" });
    }

    const user = await new User({
      name: pendingName,
      email: pendingEmail,
      password: hashedPassword,
      location: pendingLocation,
      role,
      isSubscribed: true,
      isActive: true,
    }).save();

    if (
      pendingIsProvider &&
      Array.isArray(pendingAvailability) &&
      pendingAvailability.length > 0
    ) {
      const availabilityDocs = pendingAvailability
        .map((entry) => {
          if (!entry || !entry.day || !Array.isArray(entry.slots)) {
            return null;
          }
          const sanitizedSlots = entry.slots
            .map((slot) => {
              if (!slot || !slot.start || !slot.end) return null;
              return { start: slot.start, end: slot.end };
            })
            .filter(Boolean);
          if (!sanitizedSlots.length) return null;
          return {
            professionalId: user._id,
            day: entry.day,
            slots: sanitizedSlots,
          };
        })
        .filter(Boolean);

      if (availabilityDocs.length) {
        await Availability.insertMany(availabilityDocs);
      }
    }

    await PendingSignup.deleteOne({ _id: pendingSignup._id });

    const token = jwt.sign(
      { _id: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await sendWelcomeEmail(pendingEmail, pendingName);

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
    const frontendBaseUrl =
        process.env.FRONTEND_URL || process.env.CLIENT_URL || process.env.WEB_APP_URL || "";
    const trimmedBaseUrl = frontendBaseUrl.replace(/\/$/, "");
    const resetLink = trimmedBaseUrl
        ? `${trimmedBaseUrl}/password/reset?email=${encodeURIComponent(user.email)}&code=${resetCode}`
        : "";

    const emailData = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Password reset code",
        html: `
            <div style="font-family: Arial, sans-serif; color: #1f2937;">
                <h1 style="font-size: 20px; margin-bottom: 12px;">Password reset request</h1>
                <p style="margin: 0 0 12px 0;">Here is your Haastia password reset code:</p>
                <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #111827; margin: 0 0 12px 0;">
                    ${resetCode}
                </p>
                <p style="margin: 0 0 16px 0;">Enter this code on the password reset form to choose a new password.</p>
                ${resetLink
                    ? `<p style="margin: 0 0 12px 0;">You can also go directly to the reset page and enter your code there:</p>
                       <p style="margin: 0 0 16px 0;"><a href="${resetLink}" style="display: inline-block; padding: 10px 16px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">Open reset page</a></p>`
                    : ""}
                <p style="margin: 0; color: #4b5563;">If you didn't request this, you can ignore this email.</p>
            </div>
        `,
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
  