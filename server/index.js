// require("dotenv").config();  NTD (1)
// import dotenv from "dotenv";
import {} from 'dotenv/config'
// const JWT_SECRET='dbv83r0f';
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import Stripe from "stripe";
// import postRoutes from './routes/post.js'
// import requestRoutes from './routes/request.js'
import supportRoutes from './routes/support.js'
import availabilityRoutes from "./routes/availability.js";
import userRoutes from "./routes/user.js";
import professionalRoutes from "./routes/professional.js";
import serviceRoutes from "./routes/service.js";
import bookingRoutes from "./routes/booking.js";
import blockedTimeRoutes from "./routes/blockedTime.js";
import paymentRoutes from "./routes/payment.js";

import morgan from "morgan";

const app = express();
// TODO: hide this key in Prod
const stripe = new Stripe('sk_test_51SQHC12KTn444Cl1rbhwuYFXRDArq4LQhjexNxJgzNrGUaBNkt8BERfr7QpOl0PiexvdP8E4QVqZ5SmgiQbtQ9wA00tkO405uk');

// const htpp = require('http').createServer(app); WAS causing erros replaced with below

// TODO: Below makes comp a server, uncomment if needed and make to above.
// import * as http from 'http';
// const htpp = http.createServer(app);

mongoose
    .connect(process.env.DATABASE) //NTD (1)
    // .connect('mongodb+srv://stephspie31415:6Yen1Vcv2eE2y2iM@cluster0.7xwptmh.mongodb.net/?retryWrites=true&w=majority') // replaced top
    .then(() => console.log("DB connected"))
    .catch ((err) => console.log("DB CONNECTION ERROR: ", err));

// middlewares
app.use(express.json({limit: '4mb'}));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));

// route middlewares
app.use("/api/auth", authRoutes);
// app.use("/api", postRoutes);
// app.use("/api", requestRoutes);
app.use("/api", supportRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/user", userRoutes);
app.use("/api/professional", professionalRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/blocked-times", blockedTimeRoutes);
app.use("/api/payment", paymentRoutes);

app.listen(8000, () => console.log("Server running on port 8000"));
